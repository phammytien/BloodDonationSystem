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

public class BloodInventoryService : IBloodInventoryService
{
    private readonly BloodDonationDbContext _context;

    public BloodInventoryService(BloodDonationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BloodInventoryDto>> GetAllInventoriesAsync()
    {
        var inventories = await _context.BloodInventories
            .Include(i => i.BloodType)
            .OrderByDescending(i => i.UpdatedAt)
            .ToListAsync();

        return inventories.Select(i => new BloodInventoryDto
        {
            InventoryId = i.InventoryId,
            BloodTypeId = i.BloodTypeId,
            BloodGroup = i.BloodType.BloodGroup,
            QuantityML = i.QuantityML,
            ExpiredDate = i.ExpiredDate,
            StorageLocation = i.StorageLocation,
            Status = i.Status,
            UpdatedAt = i.UpdatedAt
        });
    }

    public async Task<bool> AddInventoryAsync(AddBloodInventoryDto dto)
    {
        var inventory = new BloodInventory
        {
            BloodTypeId = dto.BloodTypeId,
            QuantityML = dto.QuantityML,
            ExpiredDate = dto.ExpiredDate,
            StorageLocation = dto.StorageLocation,
            Status = InventoryStatus.Available,
            UpdatedAt = DateTime.UtcNow
        };

        _context.BloodInventories.Add(inventory);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateStatusAsync(int inventoryId, InventoryStatus status)
    {
        var inventory = await _context.BloodInventories.FindAsync(inventoryId);
        if (inventory == null) return false;

        inventory.Status = status;
        inventory.UpdatedAt = DateTime.UtcNow;

        _context.BloodInventories.Update(inventory);
        await _context.SaveChangesAsync();
        return true;
    }
}
