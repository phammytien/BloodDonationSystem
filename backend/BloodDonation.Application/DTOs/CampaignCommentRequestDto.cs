using System.ComponentModel.DataAnnotations;

namespace BloodDonation.Application.DTOs;

public class CampaignCommentRequestDto
{
    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = null!;
}
