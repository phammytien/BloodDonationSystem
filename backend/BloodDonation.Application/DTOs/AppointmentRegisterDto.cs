using System;

namespace BloodDonation.Application.DTOs;

public class AppointmentRegisterDto
{
    public int CampaignId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string TimeSlot { get; set; } = null!;
    public string? Note { get; set; }
    public int? FileId { get; set; }
}
