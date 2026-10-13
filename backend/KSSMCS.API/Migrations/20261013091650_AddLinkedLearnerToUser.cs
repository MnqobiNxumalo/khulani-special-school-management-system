using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KSSMCS.API.Migrations
{
    /// <inheritdoc />
    public partial class AddLinkedLearnerToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LinkedLearnerId",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_LinkedLearnerId",
                table: "Users",
                column: "LinkedLearnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Learners_LinkedLearnerId",
                table: "Users",
                column: "LinkedLearnerId",
                principalTable: "Learners",
                principalColumn: "LearnerId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Learners_LinkedLearnerId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_LinkedLearnerId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LinkedLearnerId",
                table: "Users");
        }
    }
}
