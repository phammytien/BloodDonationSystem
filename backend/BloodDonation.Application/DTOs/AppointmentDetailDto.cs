using System;

namespace BloodDonation.Application.DTOs;

public class AppointmentDetailDto
{
    public int AppointmentId { get; set; }
    public string CampaignName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Organizer { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public string TimeSlot { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public DateTime CreatedAt { get; set; }

    public HealthCheckDto? HealthCheck { get; set; }
    public BloodDonationResultDto? BloodDonation { get; set; }
}

public class HealthCheckDto
{
    public string BloodPressure { get; set; } = string.Empty;
    public int Pulse { get; set; }
    public decimal Temperature { get; set; }
    public decimal Weight { get; set; }
    public decimal Hemoglobin { get; set; }
    public bool Eligible { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public DateTime CheckDate { get; set; }
}

public class BloodDonationResultDto
{
    public int VolumeML { get; set; }
    public string BloodGroup { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public DateTime DonationDate { get; set; }
}
