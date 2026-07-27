using System;
using System.ComponentModel.DataAnnotations;

namespace BloodDonation.Application.DTOs;

public class DonorProfileDto
{
    public int DonorId { get; set; }

    [Required(ErrorMessage = "Họ tên là bắt buộc")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Họ tên phải từ 3-100 ký tự")]
    public string? FullName { get; set; }

    public bool? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }

    [Required(ErrorMessage = "Số CCCD/Hộ chiếu là bắt buộc")]
    [StringLength(20, MinimumLength = 9, ErrorMessage = "Số CCCD/Hộ chiếu phải từ 9-20 ký tự")]
    public string? CitizenId { get; set; }

    [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
    public string Phone { get; set; } = null!;

    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    public string Email { get; set; } = null!;

    [StringLength(255)]
    public string? Address { get; set; }

    [StringLength(100)]
    public string? Province { get; set; }

    [StringLength(100)]
    public string? Ward { get; set; }

    [StringLength(100)]
    public string? Occupation { get; set; }

    public int? BloodTypeId { get; set; }

    // Optional fields không yêu cầu validation
    public string? BloodGroup { get; set; }

    [Range(40, 200, ErrorMessage = "Cân nặng phải từ 40-200 kg")]
    public decimal? Weight { get; set; }

    [Range(150, 250, ErrorMessage = "Chiều cao phải từ 150-250 cm")]
    public decimal? Height { get; set; }

    public string? Avatar { get; set; }

    public DateTime? LastDonationDate { get; set; }

    public int TotalDonationTimes { get; set; } = 0;
    public DateTime? UpdatedAt { get; set; }
}

