using System.Collections.Generic;
using System.Threading.Tasks;
using BloodDonation.Application.DTOs;
using BloodDonation.Domain.Enums;

namespace BloodDonation.Application.Services;

public interface IBloodInventoryService
{
    Task<IEnumerable<BloodInventoryDto>> GetAllInventoriesAsync();
    Task<bool> AddInventoryAsync(AddBloodInventoryDto dto);
    Task<bool> UpdateStatusAsync(int inventoryId, InventoryStatus status);
}
