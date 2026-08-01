using System;
using BloodDonation.Domain.Enums;

namespace BloodDonation.Application.DTOs;

public class BloodDonationDto
{
    public int DonationId { get; set; }
    public int AppointmentId { get; set; }
    public string DonorName { get; set; } = null!;
    public string DonorEmail { get; set; } = null!;
    public string DonorCitizenId { get; set; } = null!;
    public string BloodGroup { get; set; } = null!;
    public int VolumeML { get; set; }
    public DateTime DonationDate { get; set; }
    public DonationStatus DonationStatus { get; set; }
    public string StaffName { get; set; } = null!;
    public string? Remark { get; set; }
}
