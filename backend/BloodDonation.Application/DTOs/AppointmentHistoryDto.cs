using System;

namespace BloodDonation.Application.DTOs;

public class AppointmentHistoryDto
{
    public int AppointmentId { get; set; }
    public string CampaignName { get; set; } = null!;
    public string Location { get; set; } = null!;
    public DateTime AppointmentDate { get; set; }
    public string TimeSlot { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? Note { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public DateTime CreatedAt { get; set; }
}
