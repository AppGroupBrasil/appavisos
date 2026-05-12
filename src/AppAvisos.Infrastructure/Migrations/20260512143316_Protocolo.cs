using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Protocolo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Protocolo",
                table: "Reportes",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Reportes_Protocolo",
                table: "Reportes",
                column: "Protocolo",
                unique: true,
                filter: "\"Protocolo\" <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reportes_Protocolo",
                table: "Reportes");

            migrationBuilder.DropColumn(
                name: "Protocolo",
                table: "Reportes");
        }
    }
}
