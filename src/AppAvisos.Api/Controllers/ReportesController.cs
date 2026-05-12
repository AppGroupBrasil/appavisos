using System.Text;
using System.Text.Json;
using AppAvisos.Api.Auth;
using AppAvisos.Api.Services;
using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api")]
public class ReportesController(AppDbContext db, CurrentUser user, IWebHostEnvironment env, IEmailSender email, IConfiguration cfg) : ControllerBase
{
    static readonly string[] ImagensOk = { ".jpg", ".jpeg", ".png", ".webp" };
    const long MaxFoto = 5 * 1024 * 1024;
    const int MaxFotosPorReporte = 5;

    string AppUrl => cfg["AppUrl"] ?? "https://app.appavisos.com.br";

    [HttpGet("publico/reportes/{slug}/config")]
    public async Task<IActionResult> Config(string slug)
    {
        var cond = await db.Condominios.AsNoTracking().Where(c => c.Slug == slug && !c.Bloqueado)
            .Select(c => new { c.Id, c.Nome, c.LogoUrl, c.CorPrimaria, c.IdentificacaoObrigatoria })
            .FirstOrDefaultAsync();
        if (cond is null) return NotFound();
        var areas = await db.Areas.AsNoTracking().Where(a => a.CondominioId == cond.Id)
            .OrderBy(a => a.Ordem).Select(a => new { a.Id, a.Nome }).ToListAsync();
        return Ok(new { cond.Nome, cond.LogoUrl, cond.CorPrimaria, cond.IdentificacaoObrigatoria, areas });
    }

    public record CriarReporteReq(
        string Categoria, string Titulo, string Descricao, List<string>? Fotos,
        string? Nome, string? Bloco, string? Apartamento, string? Telefone, string? Email,
        Guid? AreaId);

    [HttpPost("publico/reportes/{slug}")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Criar(string slug, CriarReporteReq req)
    {
        var cond = await db.Condominios.FirstOrDefaultAsync(c => c.Slug == slug && !c.Bloqueado);
        if (cond is null) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Titulo) || string.IsNullOrWhiteSpace(req.Descricao))
            return BadRequest(new { erro = "Título e descrição são obrigatórios" });
        if (cond.IdentificacaoObrigatoria
            && (string.IsNullOrWhiteSpace(req.Nome) || string.IsNullOrWhiteSpace(req.Apartamento)))
            return BadRequest(new { erro = "Nome e apartamento são obrigatórios" });

        if (!Enum.TryParse<CategoriaReporte>(req.Categoria, true, out var categoria))
            categoria = CategoriaReporte.Outro;

        var fotos = (req.Fotos ?? new()).Take(MaxFotosPorReporte).ToList();

        var r = new Reporte
        {
            CondominioId = cond.Id,
            AreaId = req.AreaId,
            Categoria = categoria,
            Titulo = req.Titulo.Trim(),
            Descricao = req.Descricao.Trim(),
            FotosJson = JsonSerializer.Serialize(fotos),
            Nome = req.Nome?.Trim(),
            Bloco = req.Bloco?.Trim(),
            Apartamento = req.Apartamento?.Trim(),
            Telefone = req.Telefone?.Trim(),
            Email = req.Email?.Trim().ToLowerInvariant()
        };
        db.Reportes.Add(r);
        await db.SaveChangesAsync();
        return Ok(new { id = r.Id, token = r.TokenPublico, linkPublico = $"{AppUrl}/r/{r.TokenPublico}" });
    }

    [HttpPost("publico/reportes/{slug}/foto")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> UploadFoto(string slug, IFormFile file)
    {
        var cond = await db.Condominios.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == slug && !c.Bloqueado);
        if (cond is null) return NotFound();
        if (file is null || file.Length == 0) return BadRequest(new { erro = "Arquivo vazio" });
        if (file.Length > MaxFoto) return BadRequest(new { erro = "Foto até 5MB" });
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!ImagensOk.Contains(ext)) return BadRequest(new { erro = "Formato inválido" });

        var subdir = $"reportes/{cond.Id}";
        var raiz = Path.Combine(env.ContentRootPath, "uploads", subdir);
        Directory.CreateDirectory(raiz);
        var nome = $"{Guid.NewGuid():N}{ext}";
        await using (var fs = System.IO.File.Create(Path.Combine(raiz, nome)))
            await file.CopyToAsync(fs);
        return Ok(new { url = $"/uploads/{subdir}/{nome}" });
    }

    [HttpGet("reportes")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Listar([FromQuery] string? status, [FromQuery] string? categoria)
    {
        var q = db.Reportes.AsNoTracking().Include(r => r.Area)
            .Where(r => r.CondominioId == user.CondominioId);
        if (Enum.TryParse<StatusReporte>(status, true, out var s)) q = q.Where(r => r.Status == s);
        if (Enum.TryParse<CategoriaReporte>(categoria, true, out var c)) q = q.Where(r => r.Categoria == c);

        var lista = await q.OrderByDescending(r => r.CriadoEm).Take(200)
            .Select(r => new
            {
                r.Id, r.Categoria, r.Titulo, r.Status, r.Nome, r.Bloco, r.Apartamento,
                r.CriadoEm, r.RespondidoEm, area = r.Area != null ? r.Area.Nome : null,
                temFotos = r.FotosJson.Length > 2
            }).ToListAsync();
        return Ok(lista);
    }

    [HttpGet("reportes/{id:guid}")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Detalhe(Guid id)
    {
        var r = await db.Reportes.AsNoTracking().Include(x => x.Area).Include(x => x.Condominio)
            .FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (r is null) return NotFound();
        var fotos = JsonSerializer.Deserialize<List<string>>(r.FotosJson) ?? new();
        return Ok(new
        {
            r.Id, r.Categoria, r.Titulo, r.Descricao, r.Status,
            r.Nome, r.Bloco, r.Apartamento, r.Telefone, r.Email,
            area = r.Area?.Nome, r.CriadoEm, r.Resposta, r.RespondidoEm, r.RespondidoPor,
            fotos, linkPublico = $"{AppUrl}/r/{r.TokenPublico}",
            linkPdf = $"{AppUrl}/api/reportes/{r.Id}/pdf"
        });
    }

    public record ResponderReq(string Resposta);

    [HttpPost("reportes/{id:guid}/responder")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Responder(Guid id, ResponderReq req)
    {
        if (string.IsNullOrWhiteSpace(req.Resposta)) return BadRequest(new { erro = "Resposta vazia" });
        var r = await db.Reportes.Include(x => x.Condominio).FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (r is null) return NotFound();
        r.Resposta = req.Resposta.Trim();
        r.RespondidoEm = DateTime.UtcNow;
        r.RespondidoPor = (await db.Usuarios.FindAsync(user.UserId))?.Nome ?? "Síndico";
        r.Status = StatusReporte.Respondido;
        await db.SaveChangesAsync();

        if (!string.IsNullOrEmpty(r.Email))
        {
            var assunto = $"Resposta — {r.Titulo}";
            var html = $@"<div style='font-family:Inter,Arial,sans-serif;max-width:560px;margin:24px auto;padding:24px;color:#0F172A'>
<h2>{System.Net.WebUtility.HtmlEncode(r.Condominio.Nome)}</h2>
<p>Olá{(string.IsNullOrEmpty(r.Nome) ? "" : ", " + System.Net.WebUtility.HtmlEncode(r.Nome))}, recebemos sua mensagem sobre <b>{System.Net.WebUtility.HtmlEncode(r.Titulo)}</b>.</p>
<div style='background:#F1F5F9;padding:16px;border-radius:8px;margin:16px 0'>{System.Net.WebUtility.HtmlEncode(r.Resposta).Replace("\n", "<br/>")}</div>
<p style='color:#64748B;font-size:13px'>— {System.Net.WebUtility.HtmlEncode(r.RespondidoPor ?? "")}</p>
<p style='color:#64748B;font-size:12px'><a href='{AppUrl}/r/{r.TokenPublico}'>Ver registro completo</a></p></div>";
            try { await email.EnviarAsync(r.Email, assunto, html); } catch { }
        }
        return Ok(new { r.Id, r.Status, r.RespondidoEm });
    }

    [HttpGet("reportes/{id:guid}/pdf")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Pdf(Guid id)
    {
        var r = await db.Reportes.AsNoTracking().Include(x => x.Area).Include(x => x.Condominio)
            .FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (r is null) return NotFound();
        return Content(RenderHtml(r), "text/html; charset=utf-8");
    }

    [HttpGet("/r/{token}")]
    public async Task<IActionResult> Publico(string token)
    {
        var r = await db.Reportes.AsNoTracking().Include(x => x.Area).Include(x => x.Condominio)
            .FirstOrDefaultAsync(x => x.TokenPublico == token);
        if (r is null) return NotFound();
        return Content(RenderHtml(r), "text/html; charset=utf-8");
    }

    string RenderHtml(Reporte r)
    {
        var fotos = JsonSerializer.Deserialize<List<string>>(r.FotosJson) ?? new();
        var sb = new StringBuilder();
        var cat = r.Categoria switch
        {
            CategoriaReporte.Ocorrencia => "Ocorrência",
            CategoriaReporte.Manutencao => "Manutenção",
            CategoriaReporte.Reclamacao => "Reclamação",
            CategoriaReporte.Sugestao => "Sugestão",
            _ => "Outro"
        };
        sb.Append($@"<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>{System.Net.WebUtility.HtmlEncode(r.Titulo)} — {System.Net.WebUtility.HtmlEncode(r.Condominio.Nome)}</title>
<style>
@media print {{ .noprint {{ display:none }} body {{ margin:0 }} }}
body {{ font-family: Inter,Arial,sans-serif; max-width: 760px; margin: 24px auto; padding: 0 20px; color: #0F172A; }}
h1 {{ font-size: 22px; margin: 0 0 4px }}
.cat {{ display:inline-block; padding:4px 10px; border-radius:999px; background:#0F172A; color:#fff; font-size:12px; font-weight:600 }}
.meta {{ color: #64748B; font-size: 13px; margin: 12px 0 24px }}
.box {{ background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:16px }}
.fotos {{ display:grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap:8px; }}
.fotos img {{ width:100%; height:180px; object-fit:cover; border-radius:8px; border:1px solid #E2E8F0 }}
.resp {{ background:#DBEAFE; border-left:4px solid #2563EB; padding:16px; border-radius:8px }}
.acoes {{ margin: 16px 0 24px; display:flex; gap:8px; flex-wrap:wrap }}
.btn {{ background:#0F172A; color:#fff; padding:8px 16px; border:0; border-radius:6px; cursor:pointer; font-size:14px; text-decoration:none }}
.btn.sec {{ background:#E2E8F0; color:#0F172A }}
</style></head><body>
<div class='acoes noprint'>
  <button class='btn' onclick='window.print()'>Imprimir / PDF</button>
  <button class='btn sec' onclick='navigator.clipboard.writeText(location.href);this.textContent=""Link copiado""'>Copiar link</button>
</div>
<h1>{System.Net.WebUtility.HtmlEncode(r.Titulo)}</h1>
<div><span class='cat'>{cat}</span>{(r.Area != null ? $" · {System.Net.WebUtility.HtmlEncode(r.Area.Nome)}" : "")}</div>
<div class='meta'>{System.Net.WebUtility.HtmlEncode(r.Condominio.Nome)} — {r.CriadoEm:dd/MM/yyyy HH:mm}</div>
<div class='box'><b>Descrição</b><div style='margin-top:6px'>{System.Net.WebUtility.HtmlEncode(r.Descricao).Replace("\n", "<br/>")}</div></div>");
        if (fotos.Count > 0)
        {
            sb.Append("<div class='box'><b>Fotos</b><div class='fotos' style='margin-top:8px'>");
            foreach (var f in fotos) sb.Append($"<img src='{System.Net.WebUtility.HtmlEncode(f)}' alt=''/>");
            sb.Append("</div></div>");
        }
        if (!string.IsNullOrEmpty(r.Nome) || !string.IsNullOrEmpty(r.Apartamento))
        {
            sb.Append($"<div class='box'><b>Identificação</b><div style='margin-top:6px'>");
            if (!string.IsNullOrEmpty(r.Nome)) sb.Append($"Nome: {System.Net.WebUtility.HtmlEncode(r.Nome)}<br/>");
            if (!string.IsNullOrEmpty(r.Bloco)) sb.Append($"Bloco: {System.Net.WebUtility.HtmlEncode(r.Bloco)}<br/>");
            if (!string.IsNullOrEmpty(r.Apartamento)) sb.Append($"Apto: {System.Net.WebUtility.HtmlEncode(r.Apartamento)}<br/>");
            if (!string.IsNullOrEmpty(r.Telefone)) sb.Append($"Telefone: {System.Net.WebUtility.HtmlEncode(r.Telefone)}<br/>");
            if (!string.IsNullOrEmpty(r.Email)) sb.Append($"E-mail: {System.Net.WebUtility.HtmlEncode(r.Email)}");
            sb.Append("</div></div>");
        }
        if (!string.IsNullOrEmpty(r.Resposta))
        {
            sb.Append($@"<div class='resp'><b>Resposta do síndico</b><div style='margin-top:6px'>{System.Net.WebUtility.HtmlEncode(r.Resposta).Replace("\n", "<br/>")}</div>
<div style='color:#64748B;font-size:12px;margin-top:8px'>— {System.Net.WebUtility.HtmlEncode(r.RespondidoPor ?? "")}, {r.RespondidoEm:dd/MM/yyyy HH:mm}</div></div>");
        }
        sb.Append("</body></html>");
        return sb.ToString();
    }
}
