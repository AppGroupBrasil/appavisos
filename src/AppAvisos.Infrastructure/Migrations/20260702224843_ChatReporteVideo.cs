using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChatReporteVideo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VideoUrl",
                table: "Reportes",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MensagensReporte",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReporteId = table.Column<Guid>(type: "uuid", nullable: false),
                    AutorNome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    AutorPerfil = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Texto = table.Column<string>(type: "text", nullable: false),
                    FotosJson = table.Column<string>(type: "text", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MensagensReporte", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MensagensReporte_Reportes_ReporteId",
                        column: x => x.ReporteId,
                        principalTable: "Reportes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MensagensReporte_ReporteId_CriadoEm",
                table: "MensagensReporte",
                columns: new[] { "ReporteId", "CriadoEm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MensagensReporte");

            migrationBuilder.DropColumn(
                name: "VideoUrl",
                table: "Reportes");
        }
    }
}
