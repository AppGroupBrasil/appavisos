using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CanalReporte : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CanaisReporte",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CondominioId = table.Column<Guid>(type: "uuid", nullable: false),
                    AreaId = table.Column<Guid>(type: "uuid", nullable: true),
                    Nome = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: true),
                    IdentificacaoObrigatoria = table.Column<bool>(type: "boolean", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    Token = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CanaisReporte", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CanaisReporte_Areas_AreaId",
                        column: x => x.AreaId,
                        principalTable: "Areas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CanaisReporte_Condominios_CondominioId",
                        column: x => x.CondominioId,
                        principalTable: "Condominios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CanaisReporte_AreaId",
                table: "CanaisReporte",
                column: "AreaId");

            migrationBuilder.CreateIndex(
                name: "IX_CanaisReporte_CondominioId_Ativo",
                table: "CanaisReporte",
                columns: new[] { "CondominioId", "Ativo" });

            migrationBuilder.CreateIndex(
                name: "IX_CanaisReporte_Token",
                table: "CanaisReporte",
                column: "Token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CanaisReporte");
        }
    }
}
