using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ResetPasswordTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TokenReset",
                table: "Usuarios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenResetExpiraEm",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TokenReset",
                table: "Moradores",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenResetExpiraEm",
                table: "Moradores",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TokenReset",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "TokenResetExpiraEm",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "TokenReset",
                table: "Moradores");

            migrationBuilder.DropColumn(
                name: "TokenResetExpiraEm",
                table: "Moradores");
        }
    }
}
