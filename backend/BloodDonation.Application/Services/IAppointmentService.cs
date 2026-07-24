using System.Collections.Generic;
using System.Threading.Tasks;
using BloodDonation.Application.DTOs;
using BloodDonation.Domain.Entities;

namespace BloodDonation.Application.Services;

public interface IAppointmentService
{
    Task<List<CampaignDto>> GetCampaignsAsync();
    Task<bool> RegisterAppointmentAsync(int userId, AppointmentRegisterDto dto);
    Task<List<AppointmentHistoryDto>> GetUserAppointmentHistoryAsync(int userId);
}
