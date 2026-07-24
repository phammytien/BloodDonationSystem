using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BloodDonation.Application.DTOs;
using BloodDonation.Application.Services;

namespace BloodDonation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DonorController : ControllerBase
{
    private readonly IDonorService _donorService;

    public DonorController(IDonorService donorService)
    {
        _donorService = donorService;
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized(new { message = "Không xác định danh tính người dùng." });
        }

        try
        {
            var profile = await _donorService.GetProfileByUserIdAsync(userId);
            if (profile == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin người hiến." });
            }

            return Ok(profile);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] DonorProfileDto dto)
    {
        // Validate model
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage));
            return BadRequest(new { message = "Dữ liệu không hợp lệ", details = string.Join("; ", errors) });
        }

        if (dto == null)
        {
            return BadRequest(new { message = "Dữ liệu cập nhật không hợp lệ." });
        }

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized(new { message = "Không xác định danh tính người dùng." });
        }

        try
        {
            var result = await _donorService.UpdateProfileByUserIdAsync(userId, dto);
            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy thông tin người hiến để cập nhật." });
            }

            return Ok(new { message = "Cập nhật hồ sơ thông tin thành công!" });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, new { message = ex.Message, details = ex.InnerException?.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [HttpGet("blood-types")]
    public async Task<IActionResult> GetBloodTypes()
    {
        try
        {
            var bloodTypes = await _donorService.GetBloodTypesAsync();
            return Ok(bloodTypes);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }
}
