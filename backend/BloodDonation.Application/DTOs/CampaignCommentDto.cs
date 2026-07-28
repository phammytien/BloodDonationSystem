using System;

namespace BloodDonation.Application.DTOs;

public class CampaignCommentDto
{
    public int CommentId { get; set; }
    public int CampaignId { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string? FullName { get; set; }
    public string Content { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
