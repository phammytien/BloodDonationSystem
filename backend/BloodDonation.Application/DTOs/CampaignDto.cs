using System;

namespace BloodDonation.Application.DTOs;

public class CampaignDto
{
    public int CampaignId { get; set; }
    public string CampaignName { get; set; } = null!;
    public string? Description { get; set; }
    public string Location { get; set; } = null!;
    public string Organizer { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    
    public DateTime? RegistrationStartDate { get; set; }
    public DateTime? RegistrationEndDate { get; set; }
    public DateTime? DonationDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    
    public int? MaxParticipants { get; set; }
    public byte Status { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public int RegistrantCount { get; set; }
}
