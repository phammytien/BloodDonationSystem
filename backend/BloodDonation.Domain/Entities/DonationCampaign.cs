using System;
using System.Collections.Generic;
using BloodDonation.Domain.Enums;

namespace BloodDonation.Domain.Entities;

public class DonationCampaign
{
    public int CampaignId { get; set; }
    public string CampaignName { get; set; } = null!;
    public string? Description { get; set; }
    public string Location { get; set; } = null!;
    public string Organizer { get; set; } = null!;
    public DateTime StartDate { get; set; } // Can be used as RegistrationStartDate or keep for legacy compatibility
    public DateTime EndDate { get; set; } // Can be used as RegistrationEndDate or keep for legacy compatibility
    
    // New exact fields for registration and event time
    public DateTime? RegistrationStartDate { get; set; }
    public DateTime? RegistrationEndDate { get; set; }
    public DateTime? DonationDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }

    public int? MaxParticipants { get; set; }
    public CampaignStatus Status { get; set; } = CampaignStatus.Upcoming;
    public string? BannerImage { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
