using System;
using BloodDonation.Domain.Enums;

namespace BloodDonation.Application.DTOs;

public class AdminAppointmentDto
{
    public int AppointmentId { get; set; }
    public int DonorId { get; set; }
    public string? DonorName { get; set; }
    public string? DonorPhone { get; set; }
    public string? DonorEmail { get; set; }
    public string? DonorCitizenId { get; set; }
    public string? BloodGroup { get; set; }
    public int CampaignId { get; set; }
    public string? CampaignName { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string? TimeSlot { get; set; }
    public AppointmentStatus Status { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}
