using System.Threading.Tasks;
using BloodDonation.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BloodDonation.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class SystemController : ControllerBase
{
    private readonly IBackupService _backupService;

    public SystemController(IBackupService backupService)
    {
        _backupService = backupService;
    }

    [HttpGet("backups")]
    public async Task<IActionResult> GetBackups()
    {
        var backups = await _backupService.GetAvailableBackupsAsync();
        return Ok(backups);
    }

    [HttpPost("backups/create")]
    public async Task<IActionResult> CreateBackup()
    {
        try
        {
            var fileName = await _backupService.CreateBackupAsync("manual");
            return Ok(new { message = "Sao lưu dữ liệu thành công.", fileName });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi sao lưu dữ liệu.", error = ex.Message });
        }
    }

    [HttpGet("backups/download/{fileName}")]
    public async Task<IActionResult> DownloadBackup(string fileName)
    {
        var bytes = await _backupService.GetBackupFileAsync(fileName);
        if (bytes == null)
            return NotFound(new { message = "Không tìm thấy file backup." });

        return File(bytes, "application/json", fileName);
    }
}
