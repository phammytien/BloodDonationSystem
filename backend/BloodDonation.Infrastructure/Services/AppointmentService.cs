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
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found.");

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

        var campaign = await _context.DonationCampaigns.FindAsync(dto.CampaignId);
        if (campaign == null)
        {
            throw new Exception("Chiến dịch không tồn tại.");
        }

        if (campaign.Status != CampaignStatus.Opening && campaign.Status != CampaignStatus.Upcoming)
        {
            throw new Exception("Chiến dịch không trong thời gian mở đăng ký.");
        }

        var now = DateTime.UtcNow;
        if (campaign.RegistrationStartDate.HasValue && now < campaign.RegistrationStartDate.Value)
        {
            throw new Exception("Chưa tới thời gian mở đăng ký.");
        }
        if (campaign.RegistrationEndDate.HasValue && now > campaign.RegistrationEndDate.Value)
        {
            throw new Exception("Đã hết thời gian đăng ký.");
        }

        var registeredCount = await _context.Appointments.CountAsync(a => a.CampaignId == dto.CampaignId && (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed || a.Status == AppointmentStatus.Completed));
        if (campaign.MaxParticipants.HasValue && registeredCount >= campaign.MaxParticipants.Value)
        {
            throw new Exception("Chiến dịch đã đủ số lượng người đăng ký.");
        }

        var alreadyRegistered = await _context.Appointments.AnyAsync(a => a.CampaignId == dto.CampaignId && a.DonorId == donor.DonorId && a.Status != AppointmentStatus.Cancelled);
        if (alreadyRegistered)
        {
            throw new Exception("Bạn đã đăng ký tham gia chiến dịch này rồi.");
        }

        var lastCompletedAppointment = await _context.Appointments
            .Where(a => a.DonorId == donor.DonorId && a.Status == AppointmentStatus.Completed)
            .OrderByDescending(a => a.AppointmentDate)
            .FirstOrDefaultAsync();

        if (lastCompletedAppointment != null)
        {
            var daysBetweenDonations = (dto.AppointmentDate.Date - lastCompletedAppointment.AppointmentDate.Date).TotalDays;
            if (daysBetweenDonations < 84)
            {
                throw new Exception($"Bạn cần chờ ít nhất 84 ngày giữa hai lần hiến máu. Ngày đăng ký hiến mới cách lần hiến gần nhất chưa đủ (Thiếu {84 - (int)daysBetweenDonations} ngày).");
            }
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
        
        var notification = new Notification
        {
            UserId = donor.UserId,
            Title = "Đăng ký hiến máu thành công",
            Content = $"Lịch hẹn hiến máu cho chiến dịch đã được ghi nhận. Vui lòng chờ nhân viên duyệt đơn.",
            Type = "Campaign",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);

        // Gửi thông báo cho Admin/Staff
        var adminUserIds = await _context.Users
            .Where(u => u.Role.RoleName == "Admin" || u.Role.RoleName == "Staff")
            .Select(u => u.UserId)
            .ToListAsync();

        foreach (var adminId in adminUserIds)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = adminId,
                Title = "Có đăng ký hiến máu mới 📢",
                Content = $"Người hiến máu {donor.FullName} vừa đăng ký tham gia '{campaign.CampaignName}'. Vui lòng kiểm tra và xét duyệt.",
                Type = "StatusUpdate",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

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

    public async Task<List<CampaignRegistrantDto>> GetCampaignRegistrantsAsync(int campaignId)
    {
        var registrants = await _context.Appointments
            .Include(a => a.Donor)
            .Where(a => a.CampaignId == campaignId && 
                (a.Status == AppointmentStatus.Pending || 
                 a.Status == AppointmentStatus.Confirmed || 
                 a.Status == AppointmentStatus.Completed))
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new CampaignRegistrantDto
            {
                AppointmentId = a.AppointmentId,
                DonorName = a.Donor.FullName,
                Phone = !string.IsNullOrEmpty(a.Donor.Phone) 
                    ? a.Donor.Phone.Substring(0, Math.Min(4, a.Donor.Phone.Length)) + "***" + (a.Donor.Phone.Length > 7 ? a.Donor.Phone.Substring(a.Donor.Phone.Length - 3) : "")
                    : null,
                Status = a.Status == AppointmentStatus.Confirmed || a.Status == AppointmentStatus.Completed 
                    ? "Đã xác nhận" 
                    : "Chờ duyệt",
                CreatedAt = a.CreatedAt
            })
            .Take(10)
            .ToListAsync();

        return registrants;
    }

    public async Task<List<AdminAppointmentDto>> GetAllAppointmentsAsync(AppointmentStatus? status = null, int? campaignId = null)
    {
        var query = _context.Appointments
            .Include(a => a.Donor)
            .ThenInclude(d => d.BloodType)
            .Include(a => a.Campaign)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        if (campaignId.HasValue)
        {
            query = query.Where(a => a.CampaignId == campaignId.Value);
        }

        var appointments = await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return appointments.Select(a => new AdminAppointmentDto
        {
            AppointmentId = a.AppointmentId,
            DonorId = a.DonorId,
            DonorName = a.Donor?.FullName ?? "Không xác định",
            DonorPhone = a.Donor?.Phone ?? "",
            DonorEmail = a.Donor?.Email ?? "",
            DonorCitizenId = a.Donor?.CitizenId ?? "",
            BloodGroup = a.Donor?.BloodType?.BloodGroup ?? "Chưa rõ",
            CampaignId = a.CampaignId,
            CampaignName = a.Campaign?.CampaignName ?? "Không xác định",
            AppointmentDate = a.AppointmentDate,
            TimeSlot = a.TimeSlot,
            Status = a.Status,
            Note = a.Note,
            CreatedAt = a.CreatedAt
        }).ToList();
    }

    public async Task<bool> UpdateAppointmentStatusAsync(int appointmentId, AppointmentStatus status, string adminNote = null)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var appointment = await _context.Appointments
                .Include(a => a.Donor)
                .Include(a => a.Campaign)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);

            if (appointment == null) return false;

            if (appointment.Status == AppointmentStatus.Completed && status != AppointmentStatus.Completed)
            {
                throw new Exception("Không thể thay đổi trạng thái của lịch hẹn đã Hoàn thành.");
            }

            appointment.Status = status;
            if (!string.IsNullOrEmpty(adminNote))
            {
                appointment.Note = string.IsNullOrEmpty(appointment.Note) 
                    ? $"[Admin] {adminNote}" 
                    : $"{appointment.Note} | [Admin] {adminNote}";
            }

            if (status == AppointmentStatus.Completed)
            {
                // Assign blood type if not present (simplified for now)
                var bloodTypeId = appointment.Donor.BloodTypeId ?? 1; // Default to first type if unknown
                int defaultVolume = 250;

                var bloodDonation = new BloodDonation.Domain.Entities.BloodDonation
                {
                    AppointmentId = appointment.AppointmentId,
                    BloodTypeId = bloodTypeId,
                    VolumeML = defaultVolume,
                    DonationDate = DateTime.UtcNow,
                    DonationStatus = DonationStatus.Success,
                    StaffName = "Admin/Staff", 
                    Remark = "Hoàn thành hiến máu"
                };
                _context.BloodDonations.Add(bloodDonation);

                var inventory = new BloodInventory
                {
                    BloodTypeId = bloodTypeId,
                    QuantityML = defaultVolume,
                    ExpiredDate = DateTime.UtcNow.AddDays(35), // typical shelf life
                    StorageLocation = "Kho Tổng",
                    Status = InventoryStatus.Available,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.BloodInventories.Add(inventory);

                appointment.Donor.TotalDonationTimes += 1;
                appointment.Donor.LastDonationDate = DateTime.UtcNow;
                _context.Donors.Update(appointment.Donor);
            }

            var statusName = status switch {
                AppointmentStatus.Confirmed => "được xác nhận",
                AppointmentStatus.Completed => "đã hoàn thành",
                AppointmentStatus.Cancelled => "bị hủy",
                AppointmentStatus.Absent => "đánh dấu vắng mặt",
                _ => "cập nhật"
            };

            var notification = new Notification
            {
                UserId = appointment.Donor.UserId,
                Title = $"Cập nhật trạng thái đơn hiến máu",
                Content = $"Lịch hẹn của bạn cho chiến dịch '{appointment.Campaign.CampaignName}' đã {statusName}. {adminNote}",
                Type = "StatusUpdate",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
