using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BloodDonation.Application.DTOs;
using BloodDonation.Application.Services;
using BloodDonation.Infrastructure.Data;

namespace BloodDonation.Infrastructure.Services;

public class BloodDonationService : IBloodDonationService
{
    private readonly BloodDonationDbContext _context;

    public BloodDonationService(BloodDonationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BloodDonationDto>> GetAdminDonationHistoryAsync()
    {
        var donations = await _context.BloodDonations
            .Include(d => d.Appointment)
                .ThenInclude(a => a.Donor)
                    .ThenInclude(u => u.User) // if User is needed for Email, else just Donor
            .Include(d => d.BloodType)
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();

        return donations.Select(d => new BloodDonationDto
        {
            DonationId = d.DonationId,
            AppointmentId = d.AppointmentId,
            DonorName = d.Appointment?.Donor?.FullName ?? "Unknown",
            DonorEmail = d.Appointment?.Donor?.Email ?? "Unknown",
            DonorCitizenId = d.Appointment?.Donor?.CitizenId ?? "Unknown",
            BloodGroup = d.BloodType?.BloodGroup ?? "Unknown",
            VolumeML = d.VolumeML,
            DonationDate = d.DonationDate,
            DonationStatus = d.DonationStatus,
            StaffName = d.StaffName,
            Remark = d.Remark
        });
    }
}
