using System;
using System.Collections.Generic;

namespace BloodDonation.Domain.Entities;

public class Donor
{
    public int DonorId { get; set; }
    public int UserId { get; set; }
    public string? FullName { get; set; }
    public bool? Gender { get; set; } // true = Male, false = Female (or as needed)
    public DateTime? DateOfBirth { get; set; }
    public string? CitizenId { get; set; }
    public string Phone { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Address { get; set; }
    public string? Province { get; set; }
    public string? Ward { get; set; }
    public string? Occupation { get; set; }
    public int? BloodTypeId { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Height { get; set; }
    public string? Avatar { get; set; }
    public DateTime? LastDonationDate { get; set; }
    public int TotalDonationTimes { get; set; }
    public bool IsAvailable { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual BloodType BloodType { get; set; } = null!;
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public virtual ICollection<FileRecord> Files { get; set; } = new List<FileRecord>();
}
