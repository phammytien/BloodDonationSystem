using System.Collections.Generic;
using System.Threading.Tasks;
using BloodDonation.Application.DTOs;

namespace BloodDonation.Application.Services;

public interface IBloodDonationService
{
    Task<IEnumerable<BloodDonationDto>> GetAdminDonationHistoryAsync();
    Task<bool> DeleteAdminDonationAsync(int donationId);
}
