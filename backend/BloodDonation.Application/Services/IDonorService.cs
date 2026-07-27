using System.Collections.Generic;
using System.Threading.Tasks;
using BloodDonation.Application.DTOs;

namespace BloodDonation.Application.Services;

public interface IDonorService
{
    Task<DonorProfileDto?> GetProfileByUserIdAsync(int userId);
    Task<bool> UpdateProfileByUserIdAsync(int userId, DonorProfileDto dto);
    Task<List<BloodTypeDto>> GetBloodTypesAsync();
    Task<BloodTypeDto> CreateBloodTypeAsync(BloodTypeDto dto);
    Task<bool> UpdateBloodTypeAsync(int id, BloodTypeDto dto);
    Task<bool> DeleteBloodTypeAsync(int id);
    
    // Admin methods
    Task<List<DonorProfileDto>> GetAllDonorsAsync(string search = null);
    Task<DonorProfileDto> CreateDonorAdminAsync(DonorProfileDto dto);
    Task<bool> UpdateDonorAdminAsync(int donorId, DonorProfileDto dto);
    Task<bool> DeleteDonorAdminAsync(int donorId);
    Task<bool> ToggleLockDonorAdminAsync(int donorId);
}
