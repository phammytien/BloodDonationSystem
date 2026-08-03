using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BloodDonation.Application.Services;
using BloodDonation.Domain.Entities;

namespace BloodDonation.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")] // Only Admin can manage staff
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllStaffs()
    {
        var staffs = await _staffService.GetAllStaffsAsync();
        return Ok(staffs);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStaffById(int id)
    {
        var staff = await _staffService.GetStaffByIdAsync(id);
        if (staff == null) return NotFound("Không tìm thấy nhân viên.");
        return Ok(staff);
    }

    public class CreateStaffRequest
    {
        public string Username { get; set; } = null!;
        public string? FullName { get; set; }
        public string Email { get; set; } = null!;
        public string? Phone { get; set; }
        // We will generate default password if not provided
    }

    [HttpPost]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Username và Email là bắt buộc.");
        }

        var newStaff = new User
        {
            Username = request.Username,
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone
        };

        var rawPassword = "Staff@123"; // Mật khẩu mặc định

        var createdStaff = await _staffService.CreateStaffAsync(newStaff, rawPassword);
        return Ok(createdStaff);
    }

    public class UpdateStaffRequest
    {
        public string Username { get; set; } = null!;
        public string? FullName { get; set; }
        public string Email { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Password { get; set; }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStaff(int id, [FromBody] UpdateStaffRequest request)
    {
        var user = new User
        {
            Username = request.Username,
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = request.Password // StaffService uses PasswordHash field to pass the raw password if needed
        };

        var result = await _staffService.UpdateStaffAsync(id, user);
        if (!result) return NotFound("Không tìm thấy nhân viên.");

        return Ok(new { message = "Cập nhật thành công." });
    }

    [HttpPut("{id}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var result = await _staffService.ToggleStaffStatusAsync(id);
        if (!result) return NotFound("Không tìm thấy nhân viên.");

        return Ok(new { message = "Đã thay đổi trạng thái." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        var result = await _staffService.DeleteStaffAsync(id);
        if (!result) return BadRequest("Không thể xoá nhân viên này (có thể do lỗi hoặc không tìm thấy).");

        return Ok(new { message = "Xoá thành công." });
    }
}
