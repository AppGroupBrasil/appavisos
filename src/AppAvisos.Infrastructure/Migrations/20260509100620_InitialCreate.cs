using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppAvisos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Condominios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Slug = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    DescricaoCurta = table.Column<string>(type: "text", nullable: true),
                    Endereco = table.Column<string>(type: "text", nullable: true),
                    Cnpj = table.Column<string>(type: "text", nullable: true),
                    TelefoneContato = table.Column<string>(type: "text", nullable: true),
                    EmailContato = table.Column<string>(type: "text", nullable: true),
                    Site = table.Column<string>(type: "text", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    CorPrimaria = table.Column<string>(type: "text", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Condominios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Avisos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CondominioId = table.Column<Guid>(type: "uuid", nullable: false),
                    AutorId = table.Column<Guid>(type: "uuid", nullable: false),
                    QrToken = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Titulo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Texto = table.Column<string>(type: "text", nullable: false),
                    Template = table.Column<int>(type: "integer", nullable: false),
                    Categoria = table.Column<int>(type: "integer", nullable: false),
                    Escopo = table.Column<int>(type: "integer", nullable: false),
                    BlocoId = table.Column<Guid>(type: "uuid", nullable: true),
                    MoradorId = table.Column<Guid>(type: "uuid", nullable: true),
                    Urgente = table.Column<bool>(type: "boolean", nullable: false),
                    Fixado = table.Column<bool>(type: "boolean", nullable: false),
                    PublicarEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ValidoAte = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PublicadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ArquivadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AnexoUrl = table.Column<string>(type: "text", nullable: true),
                    AnexoNome = table.Column<string>(type: "text", nullable: true),
                    AnexoTamanho = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Avisos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Avisos_Condominios_CondominioId",
                        column: x => x.CondominioId,
                        principalTable: "Condominios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Blocos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CondominioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Blocos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Blocos_Condominios_CondominioId",
                        column: x => x.CondominioId,
                        principalTable: "Condominios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CondominioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SenhaHash = table.Column<string>(type: "text", nullable: false),
                    Nome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Perfil = table.Column<int>(type: "integer", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UltimoLogin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuarios_Condominios_CondominioId",
                        column: x => x.CondominioId,
                        principalTable: "Condominios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Moradores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CondominioId = table.Column<Guid>(type: "uuid", nullable: false),
                    BlocoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Nome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Telefone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Apartamento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SenhaHash = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AprovadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EmailInvalido = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Moradores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Moradores_Blocos_BlocoId",
                        column: x => x.BlocoId,
                        principalTable: "Blocos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Moradores_Condominios_CondominioId",
                        column: x => x.CondominioId,
                        principalTable: "Condominios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AvisoRecibos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AvisoId = table.Column<Guid>(type: "uuid", nullable: false),
                    MoradorId = table.Column<Guid>(type: "uuid", nullable: false),
                    CienteEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Resposta = table.Column<string>(type: "text", nullable: true),
                    RespondidoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EmailEnviadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PushEnviadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvisoRecibos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvisoRecibos_Avisos_AvisoId",
                        column: x => x.AvisoId,
                        principalTable: "Avisos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AvisoRecibos_Moradores_MoradorId",
                        column: x => x.MoradorId,
                        principalTable: "Moradores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PushSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MoradorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    P256dh = table.Column<string>(type: "text", nullable: false),
                    Auth = table.Column<string>(type: "text", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UltimoUso = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PushSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PushSubscriptions_Moradores_MoradorId",
                        column: x => x.MoradorId,
                        principalTable: "Moradores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AvisoRecibos_AvisoId_MoradorId",
                table: "AvisoRecibos",
                columns: new[] { "AvisoId", "MoradorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AvisoRecibos_MoradorId",
                table: "AvisoRecibos",
                column: "MoradorId");

            migrationBuilder.CreateIndex(
                name: "IX_Avisos_CondominioId_CriadoEm",
                table: "Avisos",
                columns: new[] { "CondominioId", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_Avisos_QrToken",
                table: "Avisos",
                column: "QrToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Blocos_CondominioId_Nome",
                table: "Blocos",
                columns: new[] { "CondominioId", "Nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Condominios_Slug",
                table: "Condominios",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Moradores_BlocoId",
                table: "Moradores",
                column: "BlocoId");

            migrationBuilder.CreateIndex(
                name: "IX_Moradores_CondominioId_Email",
                table: "Moradores",
                columns: new[] { "CondominioId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PushSubscriptions_Endpoint",
                table: "PushSubscriptions",
                column: "Endpoint",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PushSubscriptions_MoradorId",
                table: "PushSubscriptions",
                column: "MoradorId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_CondominioId_Email",
                table: "Usuarios",
                columns: new[] { "CondominioId", "Email" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AvisoRecibos");

            migrationBuilder.DropTable(
                name: "PushSubscriptions");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Avisos");

            migrationBuilder.DropTable(
                name: "Moradores");

            migrationBuilder.DropTable(
                name: "Blocos");

            migrationBuilder.DropTable(
                name: "Condominios");
        }
    }
}
