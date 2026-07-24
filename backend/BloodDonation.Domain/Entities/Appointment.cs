using System;
using BloodDonation.Domain.Enums;

namespace BloodDonation.Domain.Entities;

public class Appointment
{
    public int AppointmentId { get; set; }
    public int DonorId { get; set; }
    public int CampaignId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string TimeSlot { get; set; } = null!;
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Donor Donor { get; set; } = null!;
    public virtual DonationCampaign Campaign { get; set; } = null!;
    public virtual HealthCheck? HealthCheck { get; set; }
    public virtual BloodDonation? BloodDonation { get; set; }
}
