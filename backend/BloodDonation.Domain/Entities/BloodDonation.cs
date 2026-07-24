using System;
using BloodDonation.Domain.Enums;

namespace BloodDonation.Domain.Entities;

public class BloodDonation
{
    public int DonationId { get; set; }
    public int AppointmentId { get; set; }
    public int BloodTypeId { get; set; }
    public int VolumeML { get; set; } // 250, 350, 450
    public DateTime DonationDate { get; set; } = DateTime.UtcNow;
    public DonationStatus DonationStatus { get; set; } = DonationStatus.Success;
    public string StaffName { get; set; } = null!;
    public string? Remark { get; set; }

    // Navigation properties
    public virtual Appointment Appointment { get; set; } = null!;
    public virtual BloodType BloodType { get; set; } = null!;
}
