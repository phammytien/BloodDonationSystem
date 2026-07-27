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

    [Authorize(Roles = "Admin")]
    [HttpPost("blood-types")]
    public async Task<IActionResult> CreateBloodType([FromBody] BloodTypeDto dto)
    {
        try
        {
            var result = await _donorService.CreateBloodTypeAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tạo nhóm máu.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("blood-types/{id}")]
    public async Task<IActionResult> UpdateBloodType(int id, [FromBody] BloodTypeDto dto)
    {
        try
        {
            var success = await _donorService.UpdateBloodTypeAsync(id, dto);
            if (!success) return NotFound(new { message = "Không tìm thấy nhóm máu." });
            return Ok(new { message = "Cập nhật thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật nhóm máu.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("blood-types/{id}")]
    public async Task<IActionResult> DeleteBloodType(int id)
    {
        try
        {
            var success = await _donorService.DeleteBloodTypeAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy nhóm máu." });
            return Ok(new { message = "Xóa nhóm máu thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi xóa nhóm máu.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin/list")]
    public async Task<IActionResult> GetAdminDonors([FromQuery] string? search = null)
    {
        try
        {
            var donors = await _donorService.GetAllDonorsAsync(search);
            return Ok(donors);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách người hiến máu.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("admin")]
    public async Task<IActionResult> CreateDonorAdmin([FromBody] DonorProfileDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage));
            return BadRequest(new { message = "Dữ liệu không hợp lệ", details = string.Join("; ", errors) });
        }

        try
        {
            var result = await _donorService.CreateDonorAdminAsync(dto);
            return Ok(new { message = "Thêm người hiến máu thành công!", data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi thêm người hiến máu.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("admin/{id}")]
    public async Task<IActionResult> UpdateDonorAdmin(int id, [FromBody] DonorProfileDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage));
            return BadRequest(new { message = "Dữ liệu không hợp lệ", details = string.Join("; ", errors) });
        }

        try
        {
            var success = await _donorService.UpdateDonorAdminAsync(id, dto);
            if (!success) return NotFound(new { message = "Không tìm thấy người hiến máu." });
            
            return Ok(new { message = "Cập nhật người hiến máu thành công!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật người hiến máu.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("admin/{id}")]
    public async Task<IActionResult> DeleteDonorAdmin(int id)
    {
        try
        {
            var success = await _donorService.DeleteDonorAdminAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy người hiến máu." });
            
            return Ok(new { message = "Đã xóa người hiến máu thành công!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message }); // Throw raw message if it's the DbUpdateException
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("admin/{id}/toggle-lock")]
    public async Task<IActionResult> ToggleLockDonorAdmin(int id)
    {
        try
        {
            var success = await _donorService.ToggleLockDonorAdminAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy người hiến máu." });
            
            return Ok(new { message = "Cập nhật trạng thái khóa/mở khóa thành công!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật trạng thái.", details = ex.Message });
        }
    }
}
