using AppAvisos.Api.Auth;
using AppAvisos.Api.Services;
using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/master")]
[Authorize(Roles = "Master")]
public class MasterController(AppDbContext db, ActiveEmailProvider activeEmail) : ControllerBase
{
    public record CondominioDto(Guid Id, string Nome, string Slug, string? EmailContato, string? TelefoneContato,
        bool Bloqueado, bool Inadimplente, DateTime? UltimoPagamentoEm, string? MotivoBloqueio,
        DateTime CriadoEm, int TotalMoradores, int TotalAvisos);

    [HttpGet("condominios")]
    public async Task<IActionResult> Listar([FromQuery] string? q)
    {
        var query = db.Condominios.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(c => c.Nome.Contains(q) || c.Slug.Contains(q));

        var lista = await query.OrderByDescending(c => c.CriadoEm).Select(c => new CondominioDto(
            c.Id, c.Nome, c.Slug, c.EmailContato, c.TelefoneContato,
            c.Bloqueado, c.Inadimplente, c.UltimoPagamentoEm, c.MotivoBloqueio, c.CriadoEm,
            db.Moradores.Count(m => m.CondominioId == c.Id),
            db.Avisos.Count(a => a.CondominioId == c.Id))).ToListAsync();

        return Ok(lista);
    }

    public record AtualizarCondominioReq(string? Nome, string? EmailContato, string? TelefoneContato,
        string? Endereco, string? DescricaoCurta);

    [HttpPut("condominios/{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, AtualizarCondominioReq req)
    {
        var c = await db.Condominios.FindAsync(id);
        if (c is null) return NotFound();
        if (req.Nome is { } n) c.Nome = n;
        c.EmailContato = req.EmailContato ?? c.EmailContato;
        c.TelefoneContato = req.TelefoneContato ?? c.TelefoneContato;
        c.Endereco = req.Endereco ?? c.Endereco;
        c.DescricaoCurta = req.DescricaoCurta ?? c.DescricaoCurta;
        await db.SaveChangesAsync();
        return NoContent();
    }

    public record BloquearReq(bool Bloqueado, string? Motivo);

    [HttpPost("condominios/{id:guid}/bloqueio")]
    public async Task<IActionResult> Bloquear(Guid id, BloquearReq req)
    {
        var c = await db.Condominios.FindAsync(id);
        if (c is null) return NotFound();
        c.Bloqueado = req.Bloqueado;
        c.BloqueadoEm = req.Bloqueado ? DateTime.UtcNow : null;
        c.MotivoBloqueio = req.Bloqueado ? req.Motivo : null;
        await db.SaveChangesAsync();
        return NoContent();
    }

    public record InadimplenciaReq(bool Inadimplente, DateTime? UltimoPagamentoEm, string? Observacoes);

    [HttpPost("condominios/{id:guid}/inadimplencia")]
    public async Task<IActionResult> MarcarInadimplencia(Guid id, InadimplenciaReq req)
    {
        var c = await db.Condominios.FindAsync(id);
        if (c is null) return NotFound();
        c.Inadimplente = req.Inadimplente;
        if (req.UltimoPagamentoEm.HasValue) c.UltimoPagamentoEm = req.UltimoPagamentoEm;
        if (req.Observacoes is not null) c.ObservacoesMaster = req.Observacoes;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("condominios/{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var c = await db.Condominios.FindAsync(id);
        if (c is null) return NotFound();
        db.Condominios.Remove(c);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("config/email-provedor")]
    public IActionResult GetEmailProvedor() => Ok(new { provedor = activeEmail.Current });

    public record SetEmailProvedorReq(string Provedor);

    [HttpPut("config/email-provedor")]
    public async Task<IActionResult> SetEmailProvedor(SetEmailProvedorReq req)
    {
        if (req.Provedor != "resend" && req.Provedor != "elasticemail")
            return BadRequest(new { erro = "Provedor inválido" });

        var cfg = await db.ConfiguracoesSistema.FindAsync("email_provedor");
        if (cfg is null)
            db.ConfiguracoesSistema.Add(new ConfiguracaoSistema { Chave = "email_provedor", Valor = req.Provedor });
        else
        {
            cfg.Valor = req.Provedor;
            cfg.AtualizadoEm = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();
        activeEmail.Current = req.Provedor;
        return NoContent();
    }

    public record CriarCondominioReq(string NomeCondominio, string NomeSindico, string Email, string Telefone, string Senha);

    [HttpPost("condominios")]
    public async Task<IActionResult> CriarManual(CriarCondominioReq req)
    {
        if (await db.Usuarios.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new { erro = "E-mail já em uso" });

        var basePart = CadastroController.Slugify(req.NomeCondominio);
        var slug = basePart;
        var i = 2;
        while (await db.Condominios.AnyAsync(c => c.Slug == slug)) slug = $"{basePart}-{i++}";

        var cond = new Condominio { Nome = req.NomeCondominio, Slug = slug, TelefoneContato = req.Telefone };
        var sindico = new Usuario
        {
            CondominioId = cond.Id,
            Nome = req.NomeSindico,
            Email = req.Email.ToLowerInvariant(),
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(req.Senha),
            Perfil = PerfilUsuario.Sindico
        };
        db.Condominios.Add(cond);
        db.Usuarios.Add(sindico);
        CadastroController.SeedCategorias(db, cond.Id);
        await db.SaveChangesAsync();
        return Ok(new { cond.Id, cond.Slug });
    }
}
