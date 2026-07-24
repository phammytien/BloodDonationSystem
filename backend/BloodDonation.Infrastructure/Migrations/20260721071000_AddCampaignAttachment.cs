using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using BloodDonation.Infrastructure.Data;

#nullable disable

namespace BloodDonation.Infrastructure.Migrations
{
    [DbContext(typeof(BloodDonationDbContext))]
    [Migration("20260721071000_AddCampaignAttachment")]
    public partial class AddCampaignAttachment : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AttachmentName",
                table: "DonationCampaigns",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AttachmentUrl",
                table: "DonationCampaigns",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AttachmentName",
                table: "DonationCampaigns");

            migrationBuilder.DropColumn(
                name: "AttachmentUrl",
                table: "DonationCampaigns");
        }
    }
}
