using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using BloodDonation.Infrastructure.Data;

#nullable disable

namespace BloodDonation.Infrastructure.Migrations
{
    [DbContext(typeof(BloodDonationDbContext))]
    [Migration("20260721071500_AddAppointmentFileRelation")]
    public partial class AddAppointmentFileRelation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AppointmentId",
                table: "Files",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Files_AppointmentId",
                table: "Files",
                column: "AppointmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Files_Appointments_AppointmentId",
                table: "Files",
                column: "AppointmentId",
                principalTable: "Appointments",
                principalColumn: "AppointmentId",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Files_Appointments_AppointmentId",
                table: "Files");

            migrationBuilder.DropIndex(
                name: "IX_Files_AppointmentId",
                table: "Files");

            migrationBuilder.DropColumn(
                name: "AppointmentId",
                table: "Files");
        }
    }
}
