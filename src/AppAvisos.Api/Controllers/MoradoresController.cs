using System.Text.RegularExpressions;
using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/moradores")]
[Authorize(Roles = "Sindico,Subsindico")]
public class MoradoresController(AppDbContext db, CurrentUser user) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? status, [FromQuery] Guid? blocoId, [FromQuery] string? q)
    {
        var query = db.Moradores.AsNoTracking().Where(m => m.CondominioId == user.CondominioId);
        if (Enum.TryParse<StatusMorador>(status, true, out var st)) query = query.Where(m => m.Status == st);
        if (blocoId.HasValue) query = query.Where(m => m.BlocoId == blocoId);
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(m => m.Nome.Contains(q) || m.Email.Contains(q) || (m.Apartamento ?? "").Contains(q));

        var lista = await query.OrderBy(m => m.Nome).Select(m => new
        {
            m.Id, m.Nome, m.Email, m.Telefone, m.Apartamento, m.BlocoId, m.Status, m.CriadoEm, m.AprovadoEm
        }).ToListAsync();
        return Ok(lista);
    }

    public record CriarMoradorReq(string Nome, string Email, string? Telefone, Guid? BlocoId, string? Apartamento);

    [HttpPost]
    public async Task<IActionResult> Criar(CriarMoradorReq req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            return BadRequest(new { erro = "E-mail inválido" });
        if (await db.Moradores.AnyAsync(m => m.CondominioId == user.CondominioId && m.Email == email))
            return Conflict(new { erro = "Já existe morador com este e-mail" });

        var m = new Morador
        {
            CondominioId = user.CondominioId!.Value,
            Nome = req.Nome.Trim(),
            Email = email,
            Telefone = req.Telefone?.Trim(),
            BlocoId = req.BlocoId,
            Apartamento = req.Apartamento?.Trim(),
            Status = StatusMorador.Ativo,
            AprovadoEm = DateTime.UtcNow
        };
        db.Moradores.Add(m);
        await db.SaveChangesAsync();
        return Ok(new { m.Id });
    }

    [HttpPost("{id:guid}/aprovar")]
    public async Task<IActionResult> Aprovar(Guid id)
    {
        var m = await db.Moradores.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (m is null) return NotFound();
        m.Status = StatusMorador.Ativo;
        m.AprovadoEm = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/inativar")]
    public async Task<IActionResult> Inativar(Guid id)
    {
        var m = await db.Moradores.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (m is null) return NotFound();
        m.Status = StatusMorador.Inativo;
        await db.SaveChangesAsync();
        return NoContent();
    }

    public record AtualizarReq(string? Nome, string? Telefone, Guid? BlocoId, string? Apartamento);
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, AtualizarReq req)
    {
        var m = await db.Moradores.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (m is null) return NotFound();
        if (req.Nome is { } n) m.Nome = n.Trim();
        if (req.Telefone is not null) m.Telefone = req.Telefone.Trim();
        if (req.BlocoId.HasValue) m.BlocoId = req.BlocoId;
        if (req.Apartamento is not null) m.Apartamento = req.Apartamento.Trim();
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var m = await db.Moradores.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (m is null) return NotFound();
        db.Moradores.Remove(m);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController]
[Route("api/cadastro")]
public class CadastroPublicoMoradorController(AppDbContext db) : ControllerBase
{
    public record AutoCadastroReq(string Slug, string Nome, string Email, string? Telefone, Guid? BlocoId, string? Apartamento, string Senha);

    [HttpPost("morador")]
    public async Task<IActionResult> AutoCadastro(AutoCadastroReq req)
    {
        var cond = await db.Condominios.FirstOrDefaultAsync(c => c.Slug == req.Slug);
        if (cond is null || cond.Bloqueado) return NotFound();

        var email = req.Email.Trim().ToLowerInvariant();
        if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            return BadRequest(new { erro = "E-mail inválido" });
        if (!Regex.IsMatch(req.Senha ?? "", @"^\d{6}$"))
            return BadRequest(new { erro = "Senha deve ter 6 dígitos" });
        if (await db.Moradores.AnyAsync(m => m.CondominioId == cond.Id && m.Email == email))
            return Conflict(new { erro = "Já existe cadastro com este e-mail" });

        db.Moradores.Add(new Morador
        {
            CondominioId = cond.Id,
            Nome = req.Nome.Trim(),
            Email = email,
            Telefone = req.Telefone?.Trim(),
            BlocoId = req.BlocoId,
            Apartamento = req.Apartamento?.Trim(),
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(req.Senha),
            Status = StatusMorador.Pendente
        });
        await db.SaveChangesAsync();
        return Ok(new { mensagem = "Cadastro enviado. Aguarde aprovação do síndico." });
    }

    [HttpGet("info/{slug}")]
    public async Task<IActionResult> InfoCondominio(string slug)
    {
        var c = await db.Condominios.AsNoTracking()
            .Where(c => c.Slug == slug && !c.Bloqueado)
            .Select(c => new { c.Id, c.Nome, c.LogoUrl, c.CorPrimaria, c.DescricaoCurta }).FirstOrDefaultAsync();
        if (c is null) return NotFound();
        var blocos = await db.Blocos.AsNoTracking()
            .Where(b => b.CondominioId == c.Id).OrderBy(b => b.Ordem)
            .Select(b => new { b.Id, b.Nome }).ToListAsync();
        return Ok(new { condominio = c, blocos });
    }

    [HttpGet("por-cnpj/{cnpj}")]
    public async Task<IActionResult> PorCnpj(string cnpj)
    {
        var d = new string((cnpj ?? "").Where(char.IsDigit).ToArray());
        if (d.Length != 14) return BadRequest(new { erro = "CNPJ inválido" });
        var c = await db.Condominios.AsNoTracking()
            .Where(c => c.Cnpj != null && c.Cnpj == d && !c.Bloqueado)
            .Select(c => new { c.Slug, c.Nome }).FirstOrDefaultAsync();
        if (c is null) return NotFound(new { erro = "Condomínio não encontrado por este CNPJ" });
        return Ok(c);
    }
}
