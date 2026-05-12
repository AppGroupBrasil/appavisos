using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Reportes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IdentificacaoObrigatoria",
                table: "Condominios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Reportes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CondominioId = table.Column<Guid>(type: "uuid", nullable: false),
                    AreaId = table.Column<Guid>(type: "uuid", nullable: true),
                    Categoria = table.Column<int>(type: "integer", nullable: false),
                    Titulo = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: false),
                    FotosJson = table.Column<string>(type: "text", nullable: false),
                    Nome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    Bloco = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Apartamento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Telefone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Resposta = table.Column<string>(type: "text", nullable: true),
                    RespondidoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RespondidoPor = table.Column<string>(type: "text", nullable: true),
                    TokenPublico = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reportes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reportes_Areas_AreaId",
                        column: x => x.AreaId,
                        principalTable: "Areas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Reportes_Condominios_CondominioId",
                        column: x => x.CondominioId,
                        principalTable: "Condominios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reportes_AreaId",
                table: "Reportes",
                column: "AreaId");

            migrationBuilder.CreateIndex(
                name: "IX_Reportes_CondominioId_CriadoEm",
                table: "Reportes",
                columns: new[] { "CondominioId", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_Reportes_TokenPublico",
                table: "Reportes",
                column: "TokenPublico",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reportes");

            migrationBuilder.DropColumn(
                name: "IdentificacaoObrigatoria",
                table: "Condominios");
        }
    }
}
