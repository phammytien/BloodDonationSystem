namespace BloodDonation.Domain.Enums;

public enum InventoryStatus : byte
{
    Available = 0,
    Low = 1,
    Expired = 2,
    Discarded = 3
}
