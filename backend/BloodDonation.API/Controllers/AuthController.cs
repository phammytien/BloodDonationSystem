using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using BloodDonation.Application.DTOs;
using BloodDonation.Application.Services;

namespace BloodDonation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (request == null)
        {
            return BadRequest("Dữ liệu đăng ký không hợp lệ.");
        }

        try
        {
            var result = await _authService.RegisterAsync(request);
            if (!result)
            {
                return BadRequest(new { message = "Tên đăng nhập hoặc Email đã được sử dụng." });
            }

            return Ok(new { message = "Đăng ký tài khoản thành công! Vui lòng kiểm tra mã OTP kích hoạt tài khoản." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (request == null)
        {
            return BadRequest("Dữ liệu xác thực không hợp lệ.");
        }

        try
        {
            var result = await _authService.VerifyOtpAsync(request);
            if (!result)
            {
                return BadRequest(new { message = "Mã OTP không chính xác hoặc đã hết hạn." });
            }

            return Ok(new { message = "Kích hoạt tài khoản thành công! Bây giờ bạn có thể đăng nhập." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.Username))
        {
            return BadRequest("Tên đăng nhập hoặc Email không hợp lệ.");
        }

        try
        {
            var result = await _authService.ResendOtpAsync(request.Username);
            if (!result)
            {
                return BadRequest(new { message = "Không tìm thấy thông tin tài khoản cần gửi lại mã." });
            }

            return Ok(new { message = "Gửi lại mã OTP thành công! Vui lòng kiểm tra hộp thư." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (request == null)
        {
            return BadRequest("Dữ liệu đăng nhập không hợp lệ.");
        }

        try
        {
            var response = await _authService.LoginAsync(request);
            if (response == null)
            {
                return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });
            }

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message, isOtpVerificationRequired = true });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] string refreshToken)
    {
        if (string.IsNullOrEmpty(refreshToken))
        {
            return BadRequest("Mã Refresh Token không hợp lệ.");
        }

        try
        {
            var response = await _authService.RefreshTokenAsync(refreshToken);
            if (response == null)
            {
                return Unauthorized(new { message = "Refresh Token đã hết hạn hoặc không hợp lệ." });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.Email))
        {
            return BadRequest("Email không hợp lệ.");
        }

        try
        {
            var result = await _authService.ForgotPasswordAsync(request.Email);
            if (!result)
            {
                return BadRequest(new { message = "Email này chưa được đăng ký trong hệ thống." });
            }

            return Ok(new { message = "Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage));
            return BadRequest(new { message = "Dữ liệu không hợp lệ", details = string.Join("; ", errors) });
        }

        try
        {
            var result = await _authService.ResetPasswordAsync(request);
            if (!result)
            {
                return BadRequest(new { message = "Mã OTP không chính xác hoặc đã hết hạn." });
            }

            return Ok(new { message = "Đặt lại mật khẩu thành công! Bây giờ bạn có thể đăng nhập bằng mật khẩu mới." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }

    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage));
            return BadRequest(new { message = "Dữ liệu không hợp lệ", details = string.Join("; ", errors) });
        }

        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized(new { message = "Không xác định danh tính người dùng." });
        }

        try
        {
            var result = await _authService.ChangePasswordAsync(userId, request);
            if (!result)
            {
                return BadRequest(new { message = "Mật khẩu hiện tại không chính xác." });
            }

            return Ok(new { message = "Thay đổi mật khẩu thành công!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
        }
    }
}
