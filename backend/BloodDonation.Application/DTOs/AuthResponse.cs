namespace BloodDonation.Application.DTOs;

public class AuthResponse
{
    public string Token { get; set; } = null!;
    public string RefreshToken { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string RoleName { get; set; } = null!;
    public string FullName { get; set; } = string.Empty; // From Donors table
    public bool IsProfileUpdated { get; set; }
}
