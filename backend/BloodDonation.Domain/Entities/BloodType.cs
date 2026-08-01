using System.Collections.Generic;

namespace BloodDonation.Domain.Entities;

public class BloodType
{
    public int BloodTypeId { get; set; }
    public string BloodGroup { get; set; } = null!; // A+, A-, etc.
    public string? Description { get; set; }
    public int Status { get; set; } = 0; // 0 = Active, 1 = Inactive, 2 = Deleted
    public string? CreatedBy { get; set; }
    public System.DateTime CreatedAt { get; set; } = System.DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Donor> Donors { get; set; } = new List<Donor>();
    public virtual ICollection<BloodDonation> BloodDonations { get; set; } = new List<BloodDonation>();
    public virtual ICollection<BloodInventory> BloodInventories { get; set; } = new List<BloodInventory>();
}
