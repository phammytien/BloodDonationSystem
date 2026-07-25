using System.Collections.Generic;
using System.Threading.Tasks;
using BloodDonation.Application.DTOs;
using BloodDonation.Domain.Entities;
using BloodDonation.Domain.Enums;

namespace BloodDonation.Application.Services;

public interface IAppointmentService
{
    Task<List<CampaignDto>> GetCampaignsAsync();
    Task<bool> RegisterAppointmentAsync(int userId, AppointmentRegisterDto dto);
    Task<List<AppointmentHistoryDto>> GetUserAppointmentHistoryAsync(int userId);
    
    Task<List<CampaignRegistrantDto>> GetCampaignRegistrantsAsync(int campaignId);
    
    // Admin methods
    Task<List<AdminAppointmentDto>> GetAllAppointmentsAsync(AppointmentStatus? status = null, int? campaignId = null);
    Task<bool> UpdateAppointmentStatusAsync(int appointmentId, AppointmentStatus status, string adminNote = null);
}
