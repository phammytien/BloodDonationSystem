using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BloodDonation.Infrastructure.Data;
using BloodDonation.Domain.Enums;

namespace BloodDonation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly BloodDonationDbContext _context;

    public DashboardController(BloodDonationDbContext context)
    {
        _context = context;
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("admin/stats")]
    public async Task<IActionResult> GetAdminStats()
    {
        try
        {
            var totalDonors = await _context.Donors.CountAsync();
            var totalCampaigns = await _context.DonationCampaigns.CountAsync();
            
            // Total volume in available inventory
            var totalBloodVolume = await _context.BloodInventories
                .Where(i => i.Status == InventoryStatus.Available)
                .SumAsync(i => i.QuantityML);

            var pendingAppointments = await _context.Appointments
                .Where(a => a.Status == AppointmentStatus.Pending)
                .CountAsync();

            var recentDonations = await _context.BloodDonations
                .Include(d => d.Appointment).ThenInclude(a => a.Donor)
                .Include(d => d.BloodType)
                .OrderByDescending(d => d.DonationDate)
                .Take(5)
                .Select(d => new {
                    d.DonationId,
                    DonorName = d.Appointment.Donor.FullName,
                    BloodGroup = d.BloodType.BloodGroup,
                    d.VolumeML,
                    d.DonationDate
                })
                .ToListAsync();

            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-365);
            var dailyBloodVolumes = await _context.BloodDonations
                .Where(d => d.DonationDate >= thirtyDaysAgo && d.DonationStatus == DonationStatus.Success)
                .GroupBy(d => d.DonationDate.Date)
                .Select(g => new {
                    Date = g.Key,
                    Volume = g.Sum(d => d.VolumeML)
                })
                .OrderBy(d => d.Date)
                .ToListAsync();

            var bloodTypeStats = await _context.Donors
                .Where(d => d.BloodTypeId != null)
                .GroupBy(d => d.BloodType.BloodGroup)
                .Select(g => new {
                    BloodGroup = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var recentCampaigns = await _context.DonationCampaigns
                .OrderByDescending(c => c.StartDate)
                .Take(3)
                .Select(c => new {
                    c.CampaignId,
                    c.CampaignName,
                    c.StartDate,
                    c.EndDate,
                    c.Status,
                    c.MaxParticipants,
                    RegistrantCount = _context.Appointments.Count(a => a.CampaignId == c.CampaignId && a.Status != AppointmentStatus.Cancelled)
                })
                .ToListAsync();

            var pendingAppointmentsList = await _context.Appointments
                .Include(a => a.Donor).ThenInclude(d => d.BloodType)
                .Where(a => a.Status == AppointmentStatus.Pending)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .Select(a => new {
                    a.AppointmentId,
                    DonorName = a.Donor.FullName,
                    BloodGroup = a.Donor.BloodType != null ? a.Donor.BloodType.BloodGroup : "Chưa rõ",
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                totalDonors,
                totalCampaigns,
                totalBloodVolume,
                pendingAppointments,
                recentDonations,
                dailyBloodVolumes,
                bloodTypeStats,
                recentCampaigns,
                pendingAppointmentsList
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tải thống kê.", details = ex.Message });
        }
    }
}
