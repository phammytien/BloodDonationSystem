using System;
using BloodDonation.Domain.Enums;

namespace BloodDonation.Domain.Entities;

public class BloodInventory
{
    public int InventoryId { get; set; }
    public int BloodTypeId { get; set; }
    public int QuantityML { get; set; }
    public DateTime ExpiredDate { get; set; }
    public string StorageLocation { get; set; } = null!;
    public InventoryStatus Status { get; set; } = InventoryStatus.Available;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual BloodType BloodType { get; set; } = null!;
}
