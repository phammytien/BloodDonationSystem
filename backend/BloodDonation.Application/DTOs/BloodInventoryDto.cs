using System;
using BloodDonation.Domain.Enums;

namespace BloodDonation.Application.DTOs;

public class BloodInventoryDto
{
    public int InventoryId { get; set; }
    public int BloodTypeId { get; set; }
    public string BloodGroup { get; set; } = null!;
    public int QuantityML { get; set; }
    public DateTime ExpiredDate { get; set; }
    public string StorageLocation { get; set; } = null!;
    public InventoryStatus Status { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AddBloodInventoryDto
{
    public int BloodTypeId { get; set; }
    public int QuantityML { get; set; }
    public DateTime ExpiredDate { get; set; }
    public string StorageLocation { get; set; } = null!;
}

public class UpdateBloodInventoryStatusDto
{
    public InventoryStatus Status { get; set; }
}
