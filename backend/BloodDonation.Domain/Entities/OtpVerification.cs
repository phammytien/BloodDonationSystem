using System;

namespace BloodDonation.Domain.Entities;

public class OtpVerification
{
    public int OtpId { get; set; }
    public int UserId { get; set; }
    public string OtpCode { get; set; } = null!;
    public DateTime ExpiredAt { get; set; }
    public bool Verified { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
}
