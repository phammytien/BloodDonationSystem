using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BloodDonation.Application.Services;

namespace BloodDonation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BloodDonationController : ControllerBase
{
    private readonly IBloodDonationService _donationService;

    public BloodDonationController(IBloodDonationService donationService)
    {
        _donationService = donationService;
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("admin/history")]
    public async Task<IActionResult> GetAdminDonationHistory()
    {
        try
        {
            var history = await _donationService.GetAdminDonationHistoryAsync();
            return Ok(history);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tải lịch sử hiến máu.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpDelete("admin/{id}")]
    public async Task<IActionResult> DeleteAdminDonation(int id)
    {
        try
        {
            var success = await _donationService.DeleteAdminDonationAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy phiếu hiến máu." });
            }
            return Ok(new { message = "Xóa phiếu hiến máu thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi xóa phiếu hiến máu.", details = ex.Message });
        }
    }
}
