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
    Task<PaginatedList<AppointmentHistoryDto>> GetUserAppointmentHistoryAsync(int userId, int pageIndex = 1, int pageSize = 10);
    Task<AppointmentDetailDto?> GetAppointmentDetailAsync(int appointmentId, int userId);

    
    Task<List<CampaignRegistrantDto>> GetCampaignRegistrantsAsync(int campaignId);
    
    // Admin methods
    Task<PaginatedList<AdminAppointmentDto>> GetAllAppointmentsAsync(AppointmentStatus? status = null, int? campaignId = null, string? searchTerm = null, int pageIndex = 1, int pageSize = 10);
    Task<bool> UpdateAppointmentStatusAsync(int appointmentId, AppointmentStatus status, string? adminNote = null);
}
