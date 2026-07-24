namespace BloodDonation.Application.DTOs;

public class VerifyOtpRequest
{
    public string Username { get; set; } = null!;
    public string OtpCode { get; set; } = null!;
}
