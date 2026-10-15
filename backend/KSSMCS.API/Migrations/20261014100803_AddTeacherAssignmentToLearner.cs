using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KSSMCS.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherAssignmentToLearner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedTeacherId",
                table: "Learners",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Learners_AssignedTeacherId",
                table: "Learners",
                column: "AssignedTeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Learners_Users_AssignedTeacherId",
                table: "Learners",
                column: "AssignedTeacherId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Learners_Users_AssignedTeacherId",
                table: "Learners");

            migrationBuilder.DropIndex(
                name: "IX_Learners_AssignedTeacherId",
                table: "Learners");

            migrationBuilder.DropColumn(
                name: "AssignedTeacherId",
                table: "Learners");
        }
    }
}
