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

public class DonorService : IDonorService
{
    private readonly BloodDonationDbContext _context;

    public DonorService(BloodDonationDbContext context)
    {
        _context = context;
    }

    public async Task<DonorProfileDto?> GetProfileByUserIdAsync(int userId)
    {
        var donor = await EnsureDonorProfileAsync(userId);

        var donorWithBloodType = await _context.Donors
            .Include(d => d.BloodType)
            .FirstOrDefaultAsync(d => d.UserId == userId);

        if (donorWithBloodType == null) return null;

        return new DonorProfileDto
        {
            DonorId = donorWithBloodType.DonorId,
            FullName = donorWithBloodType.FullName,
            Gender = donorWithBloodType.Gender,
            DateOfBirth = donorWithBloodType.DateOfBirth,
            CitizenId = donorWithBloodType.CitizenId,
            Phone = donorWithBloodType.Phone,
            Email = donorWithBloodType.Email,
            Address = donorWithBloodType.Address,
            Province = donorWithBloodType.Province,
            Ward = donorWithBloodType.Ward,
            Occupation = donorWithBloodType.Occupation,
            BloodTypeId = donorWithBloodType.BloodTypeId,
            BloodGroup = donorWithBloodType.BloodType?.BloodGroup ?? string.Empty,
            Weight = donorWithBloodType.Weight,
            Height = donorWithBloodType.Height,
            Avatar = donorWithBloodType.Avatar,
            LastDonationDate = donorWithBloodType.LastDonationDate,
            TotalDonationTimes = donorWithBloodType.TotalDonationTimes,
            UpdatedAt = donorWithBloodType.UpdatedAt
        };
    }

    public async Task<bool> UpdateProfileByUserIdAsync(int userId, DonorProfileDto dto)
    {
        try
        {
            var donor = await EnsureDonorProfileAsync(userId);
            if (donor == null)
                throw new InvalidOperationException("Không thể tìm hoặc tạo hồ sơ người hiến.");

            donor.FullName = dto.FullName;
            donor.Gender = dto.Gender;
            donor.DateOfBirth = dto.DateOfBirth;
            donor.CitizenId = dto.CitizenId;
            donor.Phone = dto.Phone;
            donor.Email = dto.Email;
            donor.Address = dto.Address;
            donor.Province = dto.Province;
            donor.Ward = dto.Ward;
            donor.Occupation = dto.Occupation;
            donor.BloodTypeId = dto.BloodTypeId;
            donor.Weight = dto.Weight;
            donor.Height = dto.Height;
            donor.Avatar = dto.Avatar;
            donor.UpdatedAt = DateTime.UtcNow;

            // Also update User level email/phone for consistency
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user != null)
            {
                user.Email = dto.Email;
                user.Phone = dto.Phone;
                user.UpdatedAt = DateTime.UtcNow;
            }

            _context.Donors.Update(donor);
            if (user != null)
                _context.Users.Update(user);

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Lỗi cập nhật hồ sơ: {ex.Message}", ex);
        }
    }

    private async Task<Donor> EnsureDonorProfileAsync(int userId)
    {
        var existingDonor = await _context.Donors.FirstOrDefaultAsync(d => d.UserId == userId);
        if (existingDonor != null)
        {
            return existingDonor;
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        var defaultBloodType = await _context.BloodTypes.OrderBy(bt => bt.BloodTypeId).FirstOrDefaultAsync();

        var donor = new Donor
        {
            UserId = userId,
            FullName = null,
            Gender = null,
            DateOfBirth = null,
            CitizenId = null,
            Phone = user?.Phone ?? string.Empty,
            Email = user?.Email ?? string.Empty,
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
        await _context.SaveChangesAsync();
        return donor;
    }

    public async Task<List<BloodTypeDto>> GetBloodTypesAsync()
    {
        return await _context.BloodTypes
            .Select(bt => new BloodTypeDto
            {
                BloodTypeId = bt.BloodTypeId,
                BloodGroup = bt.BloodGroup
            })
            .ToListAsync();
    }
}
