using System;

namespace BloodDonation.Domain.Entities;

public class CampaignComment
{
    public int CommentId { get; set; }
    public int CampaignId { get; set; }
    public int UserId { get; set; }
    public string Content { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual DonationCampaign Campaign { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
