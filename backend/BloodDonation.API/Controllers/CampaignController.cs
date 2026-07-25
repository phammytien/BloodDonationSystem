using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BloodDonation.Application.Services;
using BloodDonation.Domain.Entities;

namespace BloodDonation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CampaignController : ControllerBase
{
    private readonly ICampaignService _campaignService;

    public CampaignController(ICampaignService campaignService)
    {
        _campaignService = campaignService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var campaigns = await _campaignService.GetAllCampaignsAsync();
            return Ok(campaigns);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách chiến dịch.", details = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await _campaignService.GetCampaignByIdAsync(id);
        if (c == null) return NotFound(new { message = "Không tìm thấy chiến dịch." });
        return Ok(c);
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DonationCampaign campaign)
    {
        if (campaign == null) return BadRequest(new { message = "Dữ liệu không hợp lệ." });
        try
        {
            var created = await _campaignService.CreateCampaignAsync(campaign);
            return CreatedAtAction(nameof(GetById), new { id = created.CampaignId }, created);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tạo chiến dịch.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] DonationCampaign campaign)
    {
        try
        {
            var success = await _campaignService.UpdateCampaignAsync(id, campaign);
            if (!success) return NotFound(new { message = "Không tìm thấy chiến dịch." });
            return Ok(new { message = "Cập nhật thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật chiến dịch.", details = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var success = await _campaignService.DeleteCampaignAsync(id);
            if (!success) return BadRequest(new { message = "Không thể xoá chiến dịch này (có thể chiến dịch đã có người đăng ký)." });
            return Ok(new { message = "Đã xoá chiến dịch thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi xoá chiến dịch.", details = ex.Message });
        }
    }
}
