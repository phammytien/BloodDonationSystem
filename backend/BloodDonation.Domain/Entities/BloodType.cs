using System.Collections.Generic;

namespace BloodDonation.Domain.Entities;

public class BloodType
{
    public int BloodTypeId { get; set; }
    public string BloodGroup { get; set; } = null!; // A+, A-, etc.

    // Navigation properties
    public virtual ICollection<Donor> Donors { get; set; } = new List<Donor>();
    public virtual ICollection<BloodDonation> BloodDonations { get; set; } = new List<BloodDonation>();
    public virtual ICollection<BloodInventory> BloodInventories { get; set; } = new List<BloodInventory>();
}
