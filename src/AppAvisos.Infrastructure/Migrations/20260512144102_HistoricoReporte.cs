using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HistoricoReporte : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HistoricosReporte",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReporteId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AutorNome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    AutorPerfil = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Observacao = table.Column<string>(type: "text", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistoricosReporte", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HistoricosReporte_Reportes_ReporteId",
                        column: x => x.ReporteId,
                        principalTable: "Reportes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HistoricosReporte_ReporteId_CriadoEm",
                table: "HistoricosReporte",
                columns: new[] { "ReporteId", "CriadoEm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HistoricosReporte");
        }
    }
}
