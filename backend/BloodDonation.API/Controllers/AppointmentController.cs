using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BloodDonation.Application.DTOs;
using BloodDonation.Application.Services;

namespace BloodDonation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet("campaigns")]
    public async Task<IActionResult> GetCampaigns()
    {
        try
        {
            var campaigns = await _appointmentService.GetCampaignsAsync();
            return Ok(campaigns);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tải danh sách chiến dịch.", details = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterAppointment([FromBody] AppointmentRegisterDto request)
    {
        if (request == null)
        {
            return BadRequest(new { message = "Thông tin đăng ký không hợp lệ." });
        }

        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Người dùng không hợp lệ hoặc phiên đăng nhập đã hết hạn." });
            }

            var result = await _appointmentService.RegisterAppointmentAsync(userId, request);
            if (!result)
            {
                return BadRequest(new { message = "Đăng ký hiến máu thất bại. Không thể tạo hồ sơ người hiến." });
            }

            return Ok(new { message = "Đăng ký lịch hẹn hiến máu thành công! Lịch hẹn của bạn đang chờ phê duyệt." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Người dùng không hợp lệ hoặc phiên đăng nhập đã hết hạn." });
            }

            var history = await _appointmentService.GetUserAppointmentHistoryAsync(userId);
            return Ok(history);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tải lịch sử đăng ký hiến máu.", details = ex.Message });
        }
    }
}
