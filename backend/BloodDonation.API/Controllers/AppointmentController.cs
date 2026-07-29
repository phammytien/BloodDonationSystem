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
            var details = ex.InnerException != null ? $"{ex.Message} - {ex.InnerException.Message}" : ex.Message;
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = details });
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

    [Authorize]
    [HttpGet("history/{id}")]
    public async Task<IActionResult> GetHistoryDetail(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Người dùng không hợp lệ hoặc phiên đăng nhập đã hết hạn." });
            }

            var detail = await _appointmentService.GetAppointmentDetailAsync(id, userId);
            if (detail == null)
            {
                return NotFound(new { message = "Không tìm thấy hồ sơ đăng ký hoặc bạn không có quyền xem." });
            }

            return Ok(detail);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tải chi tiết hồ sơ đăng ký.", details = ex.Message });
        }
    }

    [HttpGet("campaign/{campaignId}/registrants")]
    public async Task<IActionResult> GetCampaignRegistrants(int campaignId)
    {
        try
        {
            var registrants = await _appointmentService.GetCampaignRegistrantsAsync(campaignId);
            return Ok(registrants);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tải danh sách người đăng ký.", details = ex.Message });
        }
    }

    // --- Admin/Staff Endpoints ---
    [Authorize]
    [HttpGet("admin/list")]
    public async Task<IActionResult> GetAdminAppointments([FromQuery] byte? status = null, [FromQuery] int? campaignId = null)
    {
        try
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Staff")
            {
                return Forbid();
            }

            BloodDonation.Domain.Enums.AppointmentStatus? parsedStatus = null;
            if (status.HasValue)
            {
                parsedStatus = (BloodDonation.Domain.Enums.AppointmentStatus)status.Value;
            }

            var appointments = await _appointmentService.GetAllAppointmentsAsync(parsedStatus, campaignId);
            return Ok(appointments);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tải danh sách đơn đăng ký.", details = ex.Message });
        }
    }

    [Authorize]
    [HttpPut("admin/status/{appointmentId}")]
    public async Task<IActionResult> UpdateAppointmentStatus(int appointmentId, [FromBody] UpdateAppointmentStatusDto request)
    {
        try
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Staff")
            {
                return Forbid();
            }

            var result = await _appointmentService.UpdateAppointmentStatusAsync(
                appointmentId, 
                (BloodDonation.Domain.Enums.AppointmentStatus)request.Status, 
                request.Note
            );

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy đơn đăng ký." });
            }

            return Ok(new { message = "Cập nhật trạng thái thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật trạng thái.", details = ex.Message });
        }
    }
}
