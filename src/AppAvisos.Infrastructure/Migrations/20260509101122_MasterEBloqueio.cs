using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MasterEBloqueio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Condominios_CondominioId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_CondominioId_Email",
                table: "Usuarios");

            migrationBuilder.AlterColumn<Guid>(
                name: "CondominioId",
                table: "Usuarios",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<bool>(
                name: "Bloqueado",
                table: "Condominios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "BloqueadoEm",
                table: "Condominios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Inadimplente",
                table: "Condominios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MotivoBloqueio",
                table: "Condominios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObservacoesMaster",
                table: "Condominios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UltimoPagamentoEm",
                table: "Condominios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_CondominioId",
                table: "Usuarios",
                column: "CondominioId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Condominios_CondominioId",
                table: "Usuarios",
                column: "CondominioId",
                principalTable: "Condominios",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Condominios_CondominioId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_CondominioId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Bloqueado",
                table: "Condominios");

            migrationBuilder.DropColumn(
                name: "BloqueadoEm",
                table: "Condominios");

            migrationBuilder.DropColumn(
                name: "Inadimplente",
                table: "Condominios");

            migrationBuilder.DropColumn(
                name: "MotivoBloqueio",
                table: "Condominios");

            migrationBuilder.DropColumn(
                name: "ObservacoesMaster",
                table: "Condominios");

            migrationBuilder.DropColumn(
                name: "UltimoPagamentoEm",
                table: "Condominios");

            migrationBuilder.AlterColumn<Guid>(
                name: "CondominioId",
                table: "Usuarios",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_CondominioId_Email",
                table: "Usuarios",
                columns: new[] { "CondominioId", "Email" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Condominios_CondominioId",
                table: "Usuarios",
                column: "CondominioId",
                principalTable: "Condominios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
