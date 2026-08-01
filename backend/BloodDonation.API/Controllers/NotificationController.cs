using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BloodDonation.Infrastructure.Data;
using BloodDonation.Domain.Entities;
using BloodDonation.Application.DTOs;

namespace BloodDonation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly BloodDonationDbContext _context;

    public NotificationController(BloodDonationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized(new { message = "Không xác định danh tính người dùng." });
        }

        try
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.NotificationId,
                    n.Title,
                    n.Content,
                    n.Type,
                    n.IsRead,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống khi tải thông báo.", details = ex.Message });
        }
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized(new { message = "Không xác định danh tính người dùng." });
        }

        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == id && n.UserId == userId);

            if (notification == null)
            {
                return NotFound(new { message = "Không tìm thấy thông báo." });
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã đánh dấu đọc thông báo." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized(new { message = "Không xác định danh tính người dùng." });
        }

        try
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var n in unreadNotifications)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã đánh dấu đọc tất cả thông báo." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [HttpPost("sos")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> SendSos([FromBody] SosRequestDto request)
    {
        try
        {
            var bloodType = await _context.BloodTypes.FindAsync(request.BloodTypeId);
            if (bloodType == null) return NotFound(new { message = "Nhóm máu không tồn tại." });

            var donorUserIds = await _context.Donors
                .Where(d => d.BloodTypeId == request.BloodTypeId && d.IsAvailable)
                .Select(d => d.UserId)
                .Distinct()
                .ToListAsync();

            if (!donorUserIds.Any())
            {
                return BadRequest(new { message = $"Không tìm thấy người hiến máu nào có nhóm máu {bloodType.BloodGroup}." });
            }

            var messageContent = string.IsNullOrWhiteSpace(request.Message) 
                ? $"🚨 SOS: Bệnh viện đang cần gấp nhóm máu {bloodType.BloodGroup}. Vui lòng đến hỗ trợ ngay nếu bạn có thể!"
                : request.Message;

            var notifications = donorUserIds.Select(uid => new Notification
            {
                UserId = uid,
                Title = $"🚨 KÊU GỌI MÁU KHẨN CẤP: Nhóm {bloodType.BloodGroup}",
                Content = messageContent,
                Type = "SOS",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã phát tín hiệu SOS tới {donorUserIds.Count} người hiến máu nhóm {bloodType.BloodGroup}." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }
}
