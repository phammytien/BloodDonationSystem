using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BloodDonation.Application.DTOs;
using BloodDonation.Application.Services;
using BloodDonation.Domain.Entities;
using BloodDonation.Domain.Enums;
using BloodDonation.Infrastructure.Data;

namespace BloodDonation.Infrastructure.Services;

public class AppointmentService : IAppointmentService
{
    private readonly BloodDonationDbContext _context;

    public AppointmentService(BloodDonationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CampaignDto>> GetCampaignsAsync()
    {
        return await _context.DonationCampaigns
            .OrderBy(c => c.StartDate)
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
                RegistrantCount = c.Appointments.Count(a => 
                    a.Status == AppointmentStatus.Pending || 
                    a.Status == AppointmentStatus.Confirmed || 
                    a.Status == AppointmentStatus.Completed)
            })
            .ToListAsync();
    }

    public async Task<bool> RegisterAppointmentAsync(int userId, AppointmentRegisterDto dto)
    {
        var donor = await _context.Donors.FirstOrDefaultAsync(d => d.UserId == userId);
        if (donor == null)
        {
            // Fallback: If donor profile is somehow missing, try to get user details to create a basic donor profile
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            var defaultBloodType = await _context.BloodTypes.FirstOrDefaultAsync();
            if (defaultBloodType == null)
            {
                defaultBloodType = new BloodType { BloodGroup = "O+" };
                _context.BloodTypes.Add(defaultBloodType);
                await _context.SaveChangesAsync();
            }

            donor = new Donor
            {
                UserId = user.UserId,
                FullName = string.Empty,
                Gender = false,
                DateOfBirth = new DateTime(1900, 1, 1),
                CitizenId = "",
                Phone = user.Phone ?? "",
                Email = user.Email,
                Address = "",
                Province = "",
                Ward = "",
                BloodTypeId = defaultBloodType.BloodTypeId,
                Weight = 0m,
                Height = 0m,
                TotalDonationTimes = 0,
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Donors.Add(donor);
            await _context.SaveChangesAsync();
        }

        var appointment = new Appointment
        {
            DonorId = donor.DonorId,
            CampaignId = dto.CampaignId,
            AppointmentDate = dto.AppointmentDate,
            TimeSlot = dto.TimeSlot,
            Status = AppointmentStatus.Pending,
            Note = dto.Note,
            CreatedAt = DateTime.UtcNow
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        if (dto.FileId.HasValue)
        {
            var fileRecord = await _context.Files.FindAsync(dto.FileId.Value);
            if (fileRecord != null && fileRecord.DonorId == donor.DonorId)
            {
                fileRecord.AppointmentId = appointment.AppointmentId;
                await _context.SaveChangesAsync();
            }
        }

        return true;
    }

    public async Task<List<AppointmentHistoryDto>> GetUserAppointmentHistoryAsync(int userId)
    {
        var donor = await _context.Donors.FirstOrDefaultAsync(d => d.UserId == userId);
        if (donor == null)
        {
            return new List<AppointmentHistoryDto>();
        }

        var appointments = await _context.Appointments
            .Include(a => a.Campaign)
            .Where(a => a.DonorId == donor.DonorId)
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();

        var appointmentIds = appointments.Select(a => a.AppointmentId).ToList();
        var files = await _context.Files
            .Where(f => f.AppointmentId.HasValue && appointmentIds.Contains(f.AppointmentId.Value))
            .ToListAsync();

        return appointments.Select(a => {
            var file = files.FirstOrDefault(f => f.AppointmentId == a.AppointmentId);
            return new AppointmentHistoryDto
            {
                AppointmentId = a.AppointmentId,
                CampaignName = a.Campaign.CampaignName,
                Location = a.Campaign.Location,
                AppointmentDate = a.AppointmentDate,
                TimeSlot = a.TimeSlot,
                Status = a.Status.ToString(),
                Note = a.Note,
                FileUrl = file?.FilePath,
                FileName = file?.FileName,
                CreatedAt = a.CreatedAt
            };
        }).ToList();
    }
}
