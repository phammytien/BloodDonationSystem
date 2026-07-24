using System.Threading.Tasks;
using BloodDonation.Application.DTOs;

namespace BloodDonation.Application.Services;

public interface IAuthService
{
    Task<bool> RegisterAsync(RegisterRequest request);
    Task<bool> VerifyOtpAsync(VerifyOtpRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> RefreshTokenAsync(string refreshToken);
    Task<bool> ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<bool> ResendOtpAsync(string username);
}
