using System.Collections.Generic;
using System.Threading.Tasks;
using BloodDonation.Application.DTOs;

namespace BloodDonation.Application.Services;

public interface IDonorService
{
    Task<DonorProfileDto?> GetProfileByUserIdAsync(int userId);
    Task<bool> UpdateProfileByUserIdAsync(int userId, DonorProfileDto dto);
    Task<List<BloodTypeDto>> GetBloodTypesAsync();
}
