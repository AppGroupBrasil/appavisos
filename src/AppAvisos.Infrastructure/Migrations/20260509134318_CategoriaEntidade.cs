using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CategoriaEntidade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Categoria",
                table: "Avisos");

            migrationBuilder.AddColumn<Guid>(
                name: "CategoriaId",
                table: "Avisos",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Categorias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CondominioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categorias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categorias_Condominios_CondominioId",
                        column: x => x.CondominioId,
                        principalTable: "Condominios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Avisos_CategoriaId",
                table: "Avisos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Categorias_CondominioId_Nome",
                table: "Categorias",
                columns: new[] { "CondominioId", "Nome" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Avisos_Categorias_CategoriaId",
                table: "Avisos",
                column: "CategoriaId",
                principalTable: "Categorias",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Avisos_Categorias_CategoriaId",
                table: "Avisos");

            migrationBuilder.DropTable(
                name: "Categorias");

            migrationBuilder.DropIndex(
                name: "IX_Avisos_CategoriaId",
                table: "Avisos");

            migrationBuilder.DropColumn(
                name: "CategoriaId",
                table: "Avisos");

            migrationBuilder.AddColumn<int>(
                name: "Categoria",
                table: "Avisos",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
