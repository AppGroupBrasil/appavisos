using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AreasTimelineTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AreaId",
                table: "Avisos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Tipo",
                table: "Avisos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailAbertoEm",
                table: "AvisoRecibos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailAbertoIp",
                table: "AvisoRecibos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailAbertoUserAgent",
                table: "AvisoRecibos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisualizadoCidade",
                table: "AvisoRecibos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VisualizadoEm",
                table: "AvisoRecibos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisualizadoEstado",
                table: "AvisoRecibos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisualizadoIp",
                table: "AvisoRecibos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisualizadoPais",
                table: "AvisoRecibos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisualizadoUserAgent",
                table: "AvisoRecibos",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Areas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CondominioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Slug = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Areas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Areas_Condominios_CondominioId",
                        column: x => x.CondominioId,
                        principalTable: "Condominios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Timeline",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AvisoId = table.Column<Guid>(type: "uuid", nullable: false),
                    MoradorId = table.Column<Guid>(type: "uuid", nullable: false),
                    AutorTipo = table.Column<int>(type: "integer", nullable: false),
                    AutorId = table.Column<Guid>(type: "uuid", nullable: false),
                    AutorNome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Texto = table.Column<string>(type: "text", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Timeline", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Timeline_Avisos_AvisoId",
                        column: x => x.AvisoId,
                        principalTable: "Avisos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Timeline_Moradores_MoradorId",
                        column: x => x.MoradorId,
                        principalTable: "Moradores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Avisos_AreaId",
                table: "Avisos",
                column: "AreaId");

            migrationBuilder.CreateIndex(
                name: "IX_Areas_CondominioId_Slug",
                table: "Areas",
                columns: new[] { "CondominioId", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Timeline_AvisoId_MoradorId_CriadoEm",
                table: "Timeline",
                columns: new[] { "AvisoId", "MoradorId", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_Timeline_MoradorId",
                table: "Timeline",
                column: "MoradorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Avisos_Areas_AreaId",
                table: "Avisos",
                column: "AreaId",
                principalTable: "Areas",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Avisos_Areas_AreaId",
                table: "Avisos");

            migrationBuilder.DropTable(
                name: "Areas");

            migrationBuilder.DropTable(
                name: "Timeline");

            migrationBuilder.DropIndex(
                name: "IX_Avisos_AreaId",
                table: "Avisos");

            migrationBuilder.DropColumn(
                name: "AreaId",
                table: "Avisos");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Avisos");

            migrationBuilder.DropColumn(
                name: "EmailAbertoEm",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "EmailAbertoIp",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "EmailAbertoUserAgent",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "VisualizadoCidade",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "VisualizadoEm",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "VisualizadoEstado",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "VisualizadoIp",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "VisualizadoPais",
                table: "AvisoRecibos");

            migrationBuilder.DropColumn(
                name: "VisualizadoUserAgent",
                table: "AvisoRecibos");
        }
    }
}
