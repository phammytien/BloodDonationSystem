using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BloodDonation.Application.DTOs;
using BloodDonation.Application.Services;
using BloodDonation.Domain.Entities;
using BloodDonation.Infrastructure.Data;

namespace BloodDonation.Infrastructure.Services;

public class StaffService : IStaffService
{
    private readonly BloodDonationDbContext _context;

    public StaffService(BloodDonationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<StaffDto>> GetAllStaffsAsync()
    {
        var staffRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Staff");
        if (staffRole == null) return new List<StaffDto>();

        return await _context.Users
            .Where(u => u.RoleId == staffRole.RoleId)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new StaffDto
            {
                UserId = u.UserId,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.Phone,
                IsActive = u.IsActive,
                RoleId = u.RoleId,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<StaffDto?> GetStaffByIdAsync(int id)
    {
        var staffRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Staff");
        if (staffRole == null) return null;

        return await _context.Users
            .Where(u => u.UserId == id && u.RoleId == staffRole.RoleId)
            .Select(u => new StaffDto
            {
                UserId = u.UserId,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.Phone,
                IsActive = u.IsActive,
                RoleId = u.RoleId,
                CreatedAt = u.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<StaffDto> CreateStaffAsync(User staff, string rawPassword)
    {
        var staffRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Staff");
        if (staffRole != null)
        {
            staff.RoleId = staffRole.RoleId;
        }
        else 
        {
            staff.RoleId = 2; // Default fallback
        }

        staff.PasswordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword);
        staff.CreatedAt = DateTime.UtcNow;
        staff.IsActive = true;

        _context.Users.Add(staff);
        await _context.SaveChangesAsync();

        return new StaffDto
        {
            UserId = staff.UserId,
            Username = staff.Username,
            FullName = staff.FullName,
            Email = staff.Email,
            Phone = staff.Phone,
            IsActive = staff.IsActive,
            RoleId = staff.RoleId,
            CreatedAt = staff.CreatedAt
        };
    }

    public async Task<bool> UpdateStaffAsync(int id, User staff)
    {
        var existing = await _context.Users.FindAsync(id);
        if (existing == null) return false;

        existing.Username = staff.Username;
        existing.FullName = staff.FullName;
        existing.Email = staff.Email;
        existing.Phone = staff.Phone;
        existing.UpdatedAt = DateTime.UtcNow;
        
        // Only update password if provided
        if (!string.IsNullOrEmpty(staff.PasswordHash))
        {
            existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(staff.PasswordHash);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleStaffStatusAsync(int id)
    {
        var existing = await _context.Users.FindAsync(id);
        if (existing == null) return false;

        existing.IsActive = !existing.IsActive;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteStaffAsync(int id)
    {
        var existing = await _context.Users.FindAsync(id);
        if (existing == null) return false;

        _context.Users.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}
