using System;

namespace BloodDonation.Application.DTOs;

public class CampaignRegistrantDto
{
    public int AppointmentId { get; set; }
    public string? DonorName { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
