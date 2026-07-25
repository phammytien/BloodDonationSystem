using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BloodDonation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaignDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DonationDate",
                table: "DonationCampaigns",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "EndTime",
                table: "DonationCampaigns",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RegistrationEndDate",
                table: "DonationCampaigns",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RegistrationStartDate",
                table: "DonationCampaigns",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "StartTime",
                table: "DonationCampaigns",
                type: "time",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DonationDate",
                table: "DonationCampaigns");

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "DonationCampaigns");

            migrationBuilder.DropColumn(
                name: "RegistrationEndDate",
                table: "DonationCampaigns");

            migrationBuilder.DropColumn(
                name: "RegistrationStartDate",
                table: "DonationCampaigns");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "DonationCampaigns");
        }
    }
}
