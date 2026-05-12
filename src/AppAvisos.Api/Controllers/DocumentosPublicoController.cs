using AppAvisos.Api.Auth;
using AppAvisos.Api.Services;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/publico")]
public class DocumentosPublicoController(AppDbContext db, JwtService jwt, IEmailSender email, IConfiguration cfg) : ControllerBase
{
    string AppUrl => cfg["AppUrl"] ?? "https://app.appavisos.com.br";

    [HttpGet("{slug}/documentos")]
    public async Task<IActionResult> Listar(string slug)
    {
        var cond = await db.Condominios.AsNoTracking().Where(c => c.Slug == slug && !c.Bloqueado)
            .Select(c => new { c.Id, c.Nome, c.LogoUrl }).FirstOrDefaultAsync();
        if (cond is null) return NotFound();
        var docs = await db.Avisos.AsNoTracking()
            .Where(a => a.CondominioId == cond.Id && a.Tipo == TipoMensagem.Documento
                && a.ArquivadoEm == null && a.AnexoUrl != null)
            .Include(a => a.Categoria)
            .OrderByDescending(a => a.PublicadoEm ?? a.CriadoEm)
            .Select(a => new
            {
                a.Id, a.Titulo, a.Texto, a.AnexoNome, a.AnexoTamanho,
                categoria = a.Categoria != null ? a.Categoria.Nome : null,
                publicadoEm = a.PublicadoEm ?? a.CriadoEm
            }).Take(200).ToListAsync();
        return Ok(new { condominio = cond.Nome, logoUrl = cond.LogoUrl, documentos = docs });
    }

    public record AuthReq(string Identificador, string Pin);

    [HttpPost("{slug}/documentos/auth")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Autenticar(string slug, AuthReq req)
    {
        var cond = await db.Condominios.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == slug && !c.Bloqueado);
        if (cond is null) return NotFound();
        if (string.IsNullOrEmpty(req.Identificador) || string.IsNullOrEmpty(req.Pin))
            return BadRequest(new { erro = "Informe e-mail/telefone e PIN" });

        var ident = req.Identificador.Trim().ToLowerInvariant();
        var digitos = new string(ident.Where(char.IsDigit).ToArray());
        var m = await db.Moradores.FirstOrDefaultAsync(x =>
            x.CondominioId == cond.Id && x.Status == StatusMorador.Ativo
            && (x.Email == ident || (digitos.Length >= 8 && x.Telefone != null && x.Telefone.Contains(digitos))));
        if (m is null || string.IsNullOrEmpty(m.PinHash) || !BCrypt.Net.BCrypt.Verify(req.Pin, m.PinHash))
            return Unauthorized(new { erro = "Identificação ou PIN incorretos" });

        var token = jwt.Gerar(m.Id, m.CondominioId, m.Email, "Morador");
        return Ok(new { token, nome = m.Nome });
    }

    public record RecuperarPinReq(string Email);

    [HttpPost("{slug}/documentos/recuperar-pin")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> RecuperarPin(string slug, RecuperarPinReq req)
    {
        var cond = await db.Condominios.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == slug && !c.Bloqueado);
        if (cond is null) return NotFound();
        var emailNorm = (req.Email ?? "").Trim().ToLowerInvariant();
        var m = await db.Moradores.FirstOrDefaultAsync(x => x.CondominioId == cond.Id && x.Email == emailNorm);
        if (m is null) return Ok();
        if (string.IsNullOrEmpty(m.PinHash))
            return BadRequest(new { erro = "Você não definiu PIN no cadastro. Procure o síndico." });

        var novo = Random.Shared.Next(1000, 10000).ToString();
        m.PinHash = BCrypt.Net.BCrypt.HashPassword(novo);
        await db.SaveChangesAsync();
        var html = $@"<div style='font-family:Inter,Arial,sans-serif;max-width:480px;margin:24px auto;padding:24px;color:#0F172A'>
<h2>Seu novo PIN — {System.Net.WebUtility.HtmlEncode(cond.Nome)}</h2>
<p>Olá, {System.Net.WebUtility.HtmlEncode(m.Nome)}.</p>
<p>Seu novo PIN de acesso aos documentos é:</p>
<div style='font-size:36px;font-weight:700;letter-spacing:0.3em;background:#F1F5F9;padding:20px;border-radius:8px;text-align:center;margin:16px 0'>{novo}</div>
<p style='color:#64748B;font-size:13px'>Use este PIN em {AppUrl}/c/{slug}/documentos</p></div>";
        try { await email.EnviarAsync(emailNorm, $"Novo PIN — {cond.Nome}", html); } catch { }
        return Ok();
    }
}
