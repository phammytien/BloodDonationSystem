using System.Collections.Generic;
using System.Threading.Tasks;
using BloodDonation.Application.DTOs;
using BloodDonation.Domain.Entities;

namespace BloodDonation.Application.Services;

public interface ICampaignService
{
    Task<IEnumerable<CampaignDto>> GetAllCampaignsAsync();
    Task<CampaignDto?> GetCampaignByIdAsync(int id);
    Task<DonationCampaign> CreateCampaignAsync(DonationCampaign campaign);
    Task<bool> UpdateCampaignAsync(int id, DonationCampaign campaign);
    Task<bool> DeleteCampaignAsync(int id);
}
