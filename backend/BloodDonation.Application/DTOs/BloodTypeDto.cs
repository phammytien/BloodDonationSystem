using System;

namespace BloodDonation.Application.DTOs;

public class BloodTypeDto
{
    public int BloodTypeId { get; set; }
    public string BloodGroup { get; set; } = null!;
    public string? Description { get; set; }
    public int Status { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}
