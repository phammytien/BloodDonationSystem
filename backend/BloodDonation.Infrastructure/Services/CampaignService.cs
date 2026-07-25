using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BloodDonation.Application.DTOs;
using BloodDonation.Application.Services;
using BloodDonation.Domain.Entities;
using BloodDonation.Infrastructure.Data;

namespace BloodDonation.Infrastructure.Services;

public class CampaignService : ICampaignService
{
    private readonly BloodDonationDbContext _context;

    public CampaignService(BloodDonationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CampaignDto>> GetAllCampaignsAsync()
    {
        var campaigns = await _context.DonationCampaigns
            .Include(c => c.Appointments)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return campaigns.Select(c => new CampaignDto
        {
            CampaignId = c.CampaignId,
            CampaignName = c.CampaignName,
            Description = c.Description,
            Location = c.Location,
            Organizer = c.Organizer,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            MaxParticipants = c.MaxParticipants,
            Status = (byte)c.Status,
            AttachmentUrl = c.AttachmentUrl,
            AttachmentName = c.AttachmentName,
            RegistrantCount = c.Appointments.Count(a => a.Status != Domain.Enums.AppointmentStatus.Cancelled && a.Status != Domain.Enums.AppointmentStatus.Absent)
        });
    }

    public async Task<CampaignDto?> GetCampaignByIdAsync(int id)
    {
        var c = await _context.DonationCampaigns
            .Include(camp => camp.Appointments)
            .FirstOrDefaultAsync(camp => camp.CampaignId == id);

        if (c == null) return null;

        return new CampaignDto
        {
            CampaignId = c.CampaignId,
            CampaignName = c.CampaignName,
            Description = c.Description,
            Location = c.Location,
            Organizer = c.Organizer,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            MaxParticipants = c.MaxParticipants,
            Status = (byte)c.Status,
            AttachmentUrl = c.AttachmentUrl,
            AttachmentName = c.AttachmentName,
            RegistrantCount = c.Appointments.Count(a => a.Status != Domain.Enums.AppointmentStatus.Cancelled && a.Status != Domain.Enums.AppointmentStatus.Absent)
        };
    }

    public async Task<DonationCampaign> CreateCampaignAsync(DonationCampaign campaign)
    {
        campaign.CreatedAt = DateTime.UtcNow;
        _context.DonationCampaigns.Add(campaign);
        await _context.SaveChangesAsync();
        return campaign;
    }

    public async Task<bool> UpdateCampaignAsync(int id, DonationCampaign campaign)
    {
        var existing = await _context.DonationCampaigns.FindAsync(id);
        if (existing == null) return false;

        existing.CampaignName = campaign.CampaignName;
        existing.Description = campaign.Description;
        existing.Location = campaign.Location;
        existing.Organizer = campaign.Organizer;
        existing.StartDate = campaign.StartDate;
        existing.EndDate = campaign.EndDate;
        existing.MaxParticipants = campaign.MaxParticipants;
        existing.Status = campaign.Status;
        existing.AttachmentUrl = campaign.AttachmentUrl ?? existing.AttachmentUrl;
        existing.AttachmentName = campaign.AttachmentName ?? existing.AttachmentName;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteCampaignAsync(int id)
    {
        var existing = await _context.DonationCampaigns.Include(c => c.Appointments).FirstOrDefaultAsync(c => c.CampaignId == id);
        if (existing == null) return false;

        if (existing.Appointments.Any())
        {
            // Cannot delete if there are appointments
            return false;
        }

        _context.DonationCampaigns.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}
