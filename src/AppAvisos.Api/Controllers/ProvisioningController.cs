using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/provisioning")]
[AllowAnonymous]
public class ProvisioningController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public ProvisioningController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public record ProvisioningDto(string usuario_id, string email, string nome, string role, string status, string? expira_em);

    [HttpPost("usuario")]
    public async Task<IActionResult> Usuario([FromHeader(Name = "X-Provisioning-Secret")] string? secret, [FromBody] ProvisioningDto dto)
    {
        var expected = _config["Provisioning:Secret"] ?? Environment.GetEnvironmentVariable("PROVISIONING_SECRET");
        if (string.IsNullOrWhiteSpace(expected) || secret != expected)
            return StatusCode(403, new { error = "Assinatura inválida" });

        if (string.IsNullOrWhiteSpace(dto.usuario_id) || string.IsNullOrWhiteSpace(dto.email) || string.IsNullOrWhiteSpace(dto.nome))
            return BadRequest(new { error = "Campos obrigatórios ausentes" });

        if (!Guid.TryParse(dto.usuario_id, out var uid))
            return BadRequest(new { error = "usuario_id inválido (UUID esperado)" });

        var perfil = MapPerfil(dto.role);
        var existing = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == uid);
        if (existing != null)
        {
            existing.Email = dto.email;
            existing.Nome = dto.nome;
            existing.Perfil = perfil;
            await _db.SaveChangesAsync();
            return Ok(new { ok = true, usuario_id = dto.usuario_id });
        }

        var byEmail = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.email);
        if (byEmail != null)
        {
            // Não dá pra mudar a chave primária; reaproveita e marca apenas atualização de perfil
            byEmail.Nome = dto.nome;
            byEmail.Perfil = perfil;
            await _db.SaveChangesAsync();
            return Ok(new { ok = true, usuario_id = dto.usuario_id, id_local = byEmail.Id, reused_by_email = true });
        }

        var novo = new Usuario
        {
            Id = uid,
            Email = dto.email,
            Nome = dto.nome,
            SenhaHash = "!central!",
            Perfil = perfil,
        };
        _db.Usuarios.Add(novo);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true, usuario_id = dto.usuario_id, id_local = novo.Id });
    }

    private static PerfilUsuario MapPerfil(string role)
    {
        var r = (role ?? "").ToLowerInvariant();
        return r switch
        {
            "master" or "superadmin" => PerfilUsuario.Master,
            "admin" or "administrador" or "sindico" => PerfilUsuario.Sindico,
            "subsindico" or "supervisor" => PerfilUsuario.Subsindico,
            _ => PerfilUsuario.Morador,
        };
    }
}
