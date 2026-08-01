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
public class InventoryController : ControllerBase
{
    private readonly IBloodInventoryService _inventoryService;

    public InventoryController(IBloodInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("admin/list")]
    public async Task<IActionResult> GetAdminInventories()
    {
        try
        {
            var inventories = await _inventoryService.GetAllInventoriesAsync();
            return Ok(inventories);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tải kho máu.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpPost("admin/add")]
    public async Task<IActionResult> AddInventory([FromBody] AddBloodInventoryDto request)
    {
        if (request == null)
            return BadRequest(new { message = "Thông tin không hợp lệ." });

        try
        {
            var result = await _inventoryService.AddInventoryAsync(request);
            if (!result)
                return BadRequest(new { message = "Không thể thêm máu vào kho." });

            return Ok(new { message = "Đã thêm máu vào kho thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi thêm máu vào kho.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpPut("admin/status/{inventoryId}")]
    public async Task<IActionResult> UpdateStatus(int inventoryId, [FromBody] UpdateBloodInventoryStatusDto request)
    {
        try
        {
            var result = await _inventoryService.UpdateStatusAsync(inventoryId, request.Status);
            if (!result)
                return NotFound(new { message = "Không tìm thấy thông tin túi máu." });

            return Ok(new { message = "Cập nhật trạng thái thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật trạng thái.", details = ex.Message });
        }
    }
}
