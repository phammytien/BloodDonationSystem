using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using BloodDonation.Application.DTOs;
using BloodDonation.Application.Services;
using BloodDonation.Domain.Entities;
using BloodDonation.Domain.Enums;
using BloodDonation.Infrastructure.Data;

namespace BloodDonation.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly BloodDonationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(BloodDonationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<bool> RegisterAsync(RegisterRequest request)
    {
        // 1. Check if user already exists
        var existingUser = await _context.Users.AnyAsync(u => u.Username == request.Username || u.Email == request.Email);
        if (existingUser)
        {
            return false;
        }

        // 2. Ensure default Roles exist in database
        var donorRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Donor");
        if (donorRole == null)
        {
            // Seed default roles if they do not exist
            var adminRole = new Role { RoleName = "Admin", Description = "System Administrator" };
            var staffRole = new Role { RoleName = "Staff", Description = "Hospital Staff" };
            donorRole = new Role { RoleName = "Donor", Description = "Blood Donor" };

            _context.Roles.AddRange(adminRole, staffRole, donorRole);
            await _context.SaveChangesAsync();
        }

        // 3. Ensure default BloodTypes exist in database
        var defaultBloodType = await _context.BloodTypes.FirstOrDefaultAsync();
        if (defaultBloodType == null)
        {
            var groups = new[] { "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };
            foreach (var group in groups)
            {
                _context.BloodTypes.Add(new BloodType { BloodGroup = group });
            }
            await _context.SaveChangesAsync();
            defaultBloodType = await _context.BloodTypes.FirstOrDefaultAsync(bt => bt.BloodGroup == "O+");
        }

        // 4. Create User (initially inactive)
        var user = new User
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Email = request.Email,
            Phone = request.Phone,
            RoleId = donorRole.RoleId,
            IsActive = false,
            CreatedAt = DateTime.UtcNow
        };

        user.Email = request.Email;
        user.Phone = request.Phone;
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // 5. Create basic Donor profile linked to User
        var donor = new Donor
        {
            UserId = user.UserId,
            FullName = null,
            Gender = null,
            DateOfBirth = null,
            CitizenId = null,
            Phone = request.Phone,
            Email = request.Email,
            Address = null,
            Province = null,
            Ward = null,
            BloodTypeId = null,
            Weight = null,
            Height = null,
            TotalDonationTimes = 0,
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Donors.Add(donor);

        // 6. Generate 6-digit OTP code
        var otpCode = new Random().Next(100000, 999999).ToString();
        var otpVerification = new OtpVerification
        {
            UserId = user.UserId,
            OtpCode = otpCode,
            ExpiredAt = DateTime.UtcNow.AddMinutes(10), // OTP valid for 10 minutes
            Verified = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.OtpVerifications.Add(otpVerification);

        await _context.SaveChangesAsync();

        // Send real OTP email
        string emailSubject = "LifeGive - Mã xác thực kích hoạt tài khoản";
        string emailBody = $@"
        <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;"">
            <div style=""text-align: center; margin-bottom: 24px;"">
                <h2 style=""color: #1B4FD8; margin: 0; font-size: 24px; font-weight: 800;"">LifeGive</h2>
                <p style=""color: #6b7280; margin: 4px 0 0 0; font-size: 14px;"">Hệ thống Kết nối Hiến máu Nhân đạo</p>
            </div>
            <div style=""margin-bottom: 24px;"">
                <p style=""font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 16px 0;"">Xin chào <strong>{request.Username}</strong>,</p>
                <p style=""font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 24px 0;"">Cảm ơn bạn đã đăng ký tham gia mạng lưới hiến máu nhân đạo LifeGive. Để kích hoạt tài khoản, vui lòng sử dụng mã xác thực OTP dưới đây:</p>
                <div style=""text-align: center; margin-bottom: 24px;"">
                    <div style=""display: inline-block; padding: 12px 32px; background-color: #EFF6FF; border: 2px dashed #1B4FD8; border-radius: 8px;"">
                        <span style=""font-size: 32px; font-weight: 800; color: #1B4FD8; letter-spacing: 6px;"">{otpCode}</span>
                    </div>
                    <p style=""color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;"">(Mã OTP có hiệu lực trong vòng 10 phút)</p>
                </div>
                <p style=""font-size: 14px; color: #ef4444; line-height: 1.5; margin: 0 0 24px 0; font-style: italic;"">Lưu ý: Tuyệt đối không chia sẻ mã xác thực này với bất kỳ ai để bảo vệ tài khoản của bạn.</p>
            </div>
            <hr style=""border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;"" />
            <div style=""text-align: center; color: #9ca3af; font-size: 12px;"">
                <p style=""margin: 0 0 4px 0;"">© {DateTime.UtcNow.Year} LifeGive. All rights reserved.</p>
                <p style=""margin: 0;"">Hotline: 1900 1000  ·  Email: support@lifegive.vn</p>
            </div>
        </div>";

        await SendEmailAsync(request.Email, emailSubject, emailBody);

        // Also print to console as fallback/logging
        Console.WriteLine($"==================================================");
        Console.WriteLine($"[OTP DISPATCH SYSTEM] Sent to Email: {request.Email}");
        Console.WriteLine($"OTP Code: {otpCode}");
        Console.WriteLine($"==================================================");

        return true;
    }

    public async Task<bool> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Username);
        if (user == null)
        {
            return false;
        }

        var latestOtp = await _context.OtpVerifications
            .Where(o => o.UserId == user.UserId && !o.Verified)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        if (latestOtp == null)
        {
            return false;
        }

        if (latestOtp.OtpCode != request.OtpCode || latestOtp.ExpiredAt < DateTime.UtcNow)
        {
            return false;
        }

        latestOtp.Verified = true;
        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            return null;
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        if (!user.IsActive)
        {
            if (user.Role.RoleName == "Donor")
            {
                throw new InvalidOperationException("Tài khoản chưa được kích hoạt. Vui lòng xác thực OTP.");
            }
            else
            {
                throw new UnauthorizedAccessException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }
        }

        // Fetch Donor FullName (if Donor role)
        var donor = await _context.Donors
            .FirstOrDefaultAsync(d => d.UserId == user.UserId);
        var fullName = donor?.FullName ?? string.Empty;

        // Generate Token
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.LastLogin = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new AuthResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            Username = user.Username,
            Email = user.Email,
            RoleName = user.Role.RoleName,
            FullName = fullName,
            IsProfileUpdated = donor?.UpdatedAt != null
        };
    }

    public async Task<AuthResponse?> RefreshTokenAsync(string refreshToken)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

        if (user == null || !user.IsActive)
        {
            return null;
        }

        var newToken = GenerateJwtToken(user);
        var newRefreshToken = GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var donor = await _context.Donors.FirstOrDefaultAsync(d => d.UserId == user.UserId);
        var fullName = donor?.FullName ?? string.Empty;

        return new AuthResponse
        {
            Token = newToken,
            RefreshToken = newRefreshToken,
            Username = user.Username,
            Email = user.Email,
            RoleName = user.Role.RoleName,
            FullName = fullName,
            IsProfileUpdated = donor?.UpdatedAt != null
        };
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? "SuperSecretKeyForBloodDonationSystem2026!!!";
        var issuer = jwtSettings["Issuer"] ?? "BloodDonationSystemAPI";
        var audience = jwtSettings["Audience"] ?? "BloodDonationSystemClient";
        var expiryMinutes = double.Parse(jwtSettings["ExpiryMinutes"] ?? "120");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.RoleName)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private async Task<bool> SendEmailAsync(string recipientEmail, string subject, string htmlBody)
    {
        try
        {
            System.Net.ServicePointManager.SecurityProtocol = System.Net.SecurityProtocolType.Tls12;
            var smtpServer = _configuration["SmtpSettings:Server"] ?? "smtp.gmail.com";
            var portStr = _configuration["SmtpSettings:Port"] ?? "587";
            var senderEmail = _configuration["SmtpSettings:SenderEmail"] ?? "username@gmail.com";
            var senderPassword = _configuration["SmtpSettings:Password"] ?? "";
            var senderName = _configuration["SmtpSettings:SenderName"] ?? "Hệ thống Hiến máu LifeGive";

            if (string.IsNullOrEmpty(senderPassword))
            {
                Console.WriteLine("[SMTP ERROR] Password is not configured in appsettings.json. Cannot send real email.");
                return false;
            }

            int port = int.TryParse(portStr, out int p) ? p : 587;

            using (var message = new System.Net.Mail.MailMessage())
            {
                message.From = new System.Net.Mail.MailAddress(senderEmail, senderName);
                message.To.Add(new System.Net.Mail.MailAddress(recipientEmail));
                message.Subject = subject;
                message.Body = htmlBody;
                message.IsBodyHtml = true;

                using (var client = new System.Net.Mail.SmtpClient(smtpServer, port))
                {
                    client.UseDefaultCredentials = false;
                    client.Credentials = new System.Net.NetworkCredential(senderEmail, senderPassword);
                    client.EnableSsl = true;

                    await client.SendMailAsync(message);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SMTP ERROR] Failed to send email: {ex.ToString()}");
            return false;
        }
    }

    public async Task<bool> ForgotPasswordAsync(string email)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            return false;
        }

        // Generate 6-digit OTP code
        var otpCode = new Random().Next(100000, 999999).ToString();
        var otpVerification = new OtpVerification
        {
            UserId = user.UserId,
            OtpCode = otpCode,
            ExpiredAt = DateTime.UtcNow.AddMinutes(10), // OTP valid for 10 minutes
            Verified = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.OtpVerifications.Add(otpVerification);
        await _context.SaveChangesAsync();

        // Send OTP email
        string emailSubject = "LifeGive - Yêu cầu đặt lại mật khẩu";
        string emailBody = $@"
        <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;"">
            <div style=""text-align: center; margin-bottom: 24px;"">
                <h2 style=""color: #1B4FD8; margin: 0; font-size: 24px; font-weight: 800;"">LifeGive</h2>
                <p style=""color: #6b7280; margin: 4px 0 0 0; font-size: 14px;"">Hệ thống Kết nối Hiến máu Nhân đạo</p>
            </div>
            <div style=""margin-bottom: 24px;"">
                <p style=""font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 16px 0;"">Xin chào <strong>{user.Username}</strong>,</p>
                <p style=""font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 24px 0;"">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực OTP dưới đây để hoàn tất:</p>
                <div style=""text-align: center; margin-bottom: 24px;"">
                    <div style=""display: inline-block; padding: 12px 32px; background-color: #EFF6FF; border: 2px dashed #1B4FD8; border-radius: 8px;"">
                        <span style=""font-size: 32px; font-weight: 800; color: #1B4FD8; letter-spacing: 6px;"">{otpCode}</span>
                    </div>
                    <p style=""color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;"">(Mã OTP có hiệu lực trong vòng 10 phút)</p>
                </div>
                <p style=""font-size: 14px; color: #374151; line-height: 1.5; margin: 0 0 24px 0;"">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            </div>
            <hr style=""border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;"" />
            <div style=""text-align: center; color: #9ca3af; font-size: 12px;"">
                <p style=""margin: 0 0 4px 0;"">© {DateTime.UtcNow.Year} LifeGive. All rights reserved.</p>
                <p style=""margin: 0;"">Hotline: 1900 1000  ·  Email: support@lifegive.vn</p>
            </div>
        </div>";

        await SendEmailAsync(email, emailSubject, emailBody);

        Console.WriteLine($"==================================================");
        Console.WriteLine($"[PASSWORD RESET OTP] Sent to Email: {email}");
        Console.WriteLine($"OTP Code: {otpCode}");
        Console.WriteLine($"==================================================");

        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
        {
            return false;
        }

        var latestOtp = await _context.OtpVerifications
            .Where(o => o.UserId == user.UserId && !o.Verified)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        if (latestOtp == null)
        {
            return false;
        }

        if (latestOtp.OtpCode != request.OtpCode || latestOtp.ExpiredAt < DateTime.UtcNow)
        {
            return false;
        }

        latestOtp.Verified = true;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null)
        {
            return false;
        }

        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
        {
            return false;
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResendOtpAsync(string username)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username || u.Email == username);
        if (user == null)
        {
            return false;
        }

        // Generate 6-digit OTP code
        var otpCode = new Random().Next(100000, 999999).ToString();
        var otpVerification = new OtpVerification
        {
            UserId = user.UserId,
            OtpCode = otpCode,
            ExpiredAt = DateTime.UtcNow.AddMinutes(10), // OTP valid for 10 minutes
            Verified = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.OtpVerifications.Add(otpVerification);
        await _context.SaveChangesAsync();

        // Send OTP email
        string emailSubject = "LifeGive - Gửi lại mã xác thực kích hoạt tài khoản";
        string emailBody = $@"
        <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;"">
            <div style=""text-align: center; margin-bottom: 24px;"">
                <h2 style=""color: #1B4FD8; margin: 0; font-size: 24px; font-weight: 800;"">LifeGive</h2>
                <p style=""color: #6b7280; margin: 4px 0 0 0; font-size: 14px;"">Hệ thống Kết nối Hiến máu Nhân đạo</p>
            </div>
            <div style=""margin-bottom: 24px;"">
                <p style=""font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 16px 0;"">Xin chào <strong>{user.Username}</strong>,</p>
                <p style=""font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 24px 0;"">Chúng tôi nhận được yêu cầu gửi lại mã xác thực kích hoạt tài khoản của bạn. Vui lòng sử dụng mã xác thực OTP dưới đây:</p>
                <div style=""text-align: center; margin-bottom: 24px;"">
                    <div style=""display: inline-block; padding: 12px 32px; background-color: #EFF6FF; border: 2px dashed #1B4FD8; border-radius: 8px;"">
                        <span style=""font-size: 32px; font-weight: 800; color: #1B4FD8; letter-spacing: 6px;"">{otpCode}</span>
                    </div>
                    <p style=""color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;"">(Mã OTP có hiệu lực trong vòng 10 phút)</p>
                </div>
                <p style=""font-size: 14px; color: #ef4444; line-height: 1.5; margin: 0 0 24px 0; font-style: italic;"">Lưu ý: Tuyệt đối không chia sẻ mã xác thực này với bất kỳ ai để bảo vệ tài khoản của bạn.</p>
            </div>
            <hr style=""border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;"" />
            <div style=""text-align: center; color: #9ca3af; font-size: 12px;"">
                <p style=""margin: 0 0 4px 0;"">© {DateTime.UtcNow.Year} LifeGive. All rights reserved.</p>
                <p style=""margin: 0;"">Hotline: 1900 1000  ·  Email: support@lifegive.vn</p>
            </div>
        </div>";

        await SendEmailAsync(user.Email, emailSubject, emailBody);

        Console.WriteLine($"==================================================");
        Console.WriteLine($"[OTP RESEND SYSTEM] Sent to Email: {user.Email}");
        Console.WriteLine($"OTP Code: {otpCode}");
        Console.WriteLine($"==================================================");

        return true;
    }
}
