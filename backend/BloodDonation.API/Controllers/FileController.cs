using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BloodDonation.Infrastructure.Data;
using BloodDonation.Domain.Entities;

namespace BloodDonation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FileController : ControllerBase
{
    private readonly BloodDonationDbContext _context;
    private readonly string _uploadFolder;

    public FileController(BloodDonationDbContext context)
    {
        _context = context;
        // Target folder: wwwroot/uploads/health-checks
        _uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "health-checks");
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn tệp tin hợp lệ để tải lên." });
        }

        // Validate file size (max 5MB)
        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "Kích thước tệp tin không được vượt quá 5MB." });
        }

        // Validate extension
        var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };
        var extension = Path.GetExtension(file.FileName).ToLower();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Định dạng tệp không được hỗ trợ. Chỉ cho phép các định dạng PDF, Word (doc, docx) hoặc Hình ảnh (jpg, png)." });
        }

        // Get logged in user id
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized(new { message = "Không xác định danh tính người dùng." });
        }

        try
        {
            // Ensure Donor profile exists
            var donor = await _context.Donors.FirstOrDefaultAsync(d => d.UserId == userId);
            if (donor == null)
            {
                var user = await _context.Users.FindAsync(userId);
                donor = new Donor
                {
                    UserId = userId,
                    FullName = null,
                    Gender = null,
                    DateOfBirth = null,
                    CitizenId = null,
                    Phone = user?.Phone ?? string.Empty,
                    Email = user?.Email ?? string.Empty,
                    Address = null,
                    Province = null,
                    Ward = null,
                    BloodTypeId = null,
                    Weight = null,
                    Height = null,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Donors.Add(donor);
                await _context.SaveChangesAsync();
            }

            // Create directory if not exists
            if (!Directory.Exists(_uploadFolder))
            {
                Directory.CreateDirectory(_uploadFolder);
            }

            // Generate unique filename to avoid collision
            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePathOnDisk = Path.Combine(_uploadFolder, uniqueFileName);

            // Save file
            using (var stream = new FileStream(filePathOnDisk, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Relative path for client to access
            var relativePath = $"/uploads/health-checks/{uniqueFileName}";

            // Register in database
            var fileRecord = new FileRecord
            {
                DonorId = donor.DonorId,
                FileName = file.FileName,
                FilePath = relativePath,
                ContentType = file.ContentType,
                FileSize = file.Length,
                UploadedAt = DateTime.UtcNow
            };

            _context.Files.Add(fileRecord);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                fileId = fileRecord.FileId,
                fileName = fileRecord.FileName,
                filePath = relativePath,
                message = "Tải lên tài liệu khám sức khỏe thành công."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống khi tải tệp lên.", details = ex.Message });
        }
    }
}
