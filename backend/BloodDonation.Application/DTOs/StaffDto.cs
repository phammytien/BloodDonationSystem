using System;

namespace BloodDonation.Application.DTOs;

public class StaffDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string? FullName { get; set; }
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public bool IsActive { get; set; }
    public int RoleId { get; set; }
    public DateTime CreatedAt { get; set; }
}
