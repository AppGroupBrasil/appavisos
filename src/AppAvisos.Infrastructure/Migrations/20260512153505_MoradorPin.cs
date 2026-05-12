using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MoradorPin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PinHash",
                table: "Moradores",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PinHash",
                table: "Moradores");
        }
    }
}
