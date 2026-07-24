using System.ComponentModel.DataAnnotations;

namespace BloodDonation.Application.DTOs;

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Mật khẩu hiện tại là bắt buộc")]
    public string OldPassword { get; set; } = null!;

    [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
    [MinLength(6, ErrorMessage = "Mật khẩu mới phải có tối thiểu 6 ký tự")]
    public string NewPassword { get; set; } = null!;
}
