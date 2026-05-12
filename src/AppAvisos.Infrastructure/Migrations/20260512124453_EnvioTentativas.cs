using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnvioTentativas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EmailProximaTentativaEm",
                table: "AvisoRecibos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EmailTentativas",
                table: "AvisoRecibos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PushProximaTentativaEm",
                table: "AvisoRecibos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PushTentativas",
                table: "AvisoRecibos",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailProximaTentativaEm",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "EmailTentativas",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "PushProximaTentativaEm",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "PushTentativas",
                table: "AvisoRecibos");
        }
    }
}
