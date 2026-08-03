using System.Collections.Generic;
using System.Threading.Tasks;
using BloodDonation.Application.DTOs;
using BloodDonation.Domain.Entities;

namespace BloodDonation.Application.Services;

public interface IStaffService
{
    Task<IEnumerable<StaffDto>> GetAllStaffsAsync();
    Task<StaffDto?> GetStaffByIdAsync(int id);
    Task<StaffDto> CreateStaffAsync(User staff, string rawPassword);
    Task<bool> UpdateStaffAsync(int id, User staff);
    Task<bool> ToggleStaffStatusAsync(int id);
    Task<bool> DeleteStaffAsync(int id);
}
