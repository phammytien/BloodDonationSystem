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
        return await _context.DonationCampaigns
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CampaignDto
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
            })
            .ToListAsync();
    }

    public async Task<CampaignDto?> GetCampaignByIdAsync(int id)
    {
        return await _context.DonationCampaigns
            .Where(camp => camp.CampaignId == id)
            .Select(c => new CampaignDto
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
            })
            .FirstOrDefaultAsync();
    }

    public async Task<DonationCampaign> CreateCampaignAsync(DonationCampaign campaign)
    {
        campaign.CreatedAt = DateTime.UtcNow;
        _context.DonationCampaigns.Add(campaign);
        await _context.SaveChangesAsync();

        // Gửi thông báo cho tất cả người hiến máu (Donors) về chiến dịch mới
        var donorUserIds = await _context.Donors.Select(d => d.UserId).Distinct().ToListAsync();
        var notifications = donorUserIds.Select(userId => new Notification
        {
            UserId = userId,
            Title = "Chiến dịch hiến máu mới \ud83e\ude78",
            Content = $"Chiến dịch '{campaign.CampaignName}' vừa được phát động tại {campaign.Location}. Hãy đăng ký tham gia ngay!",
            Type = $"Campaign|{campaign.CampaignId}",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        if (notifications.Any())
        {
            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }

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

    public async Task<IEnumerable<CampaignCommentDto>> GetCommentsByCampaignIdAsync(int campaignId)
    {
        var comments = await _context.CampaignComments
            .Include(c => c.User)
            .ThenInclude(u => u.Donor) // Load donor profile if exists
            .Where(c => c.CampaignId == campaignId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return comments.Select(c => new CampaignCommentDto
        {
            CommentId = c.CommentId,
            CampaignId = c.CampaignId,
            UserId = c.UserId,
            Username = c.User.Username,
            FullName = c.User.Donor?.FullName ?? c.User.Username,
            Content = c.Content,
            CreatedAt = c.CreatedAt
        });
    }

    public async Task<CampaignCommentDto?> AddCommentAsync(int campaignId, int userId, string content)
    {
        // Check if campaign exists
        var campaignExists = await _context.DonationCampaigns.AnyAsync(c => c.CampaignId == campaignId);
        if (!campaignExists) return null;

        var comment = new CampaignComment
        {
            CampaignId = campaignId,
            UserId = userId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        _context.CampaignComments.Add(comment);
        await _context.SaveChangesAsync();

        // Fetch user data for DTO
        var user = await _context.Users.Include(u => u.Donor).FirstOrDefaultAsync(u => u.UserId == userId);
        
        return new CampaignCommentDto
        {
            CommentId = comment.CommentId,
            CampaignId = comment.CampaignId,
            UserId = comment.UserId,
            Username = user?.Username ?? "",
            FullName = user?.Donor?.FullName ?? user?.Username,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt
        };
    }
}
