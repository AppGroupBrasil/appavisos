using System.Text;
using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/timeline")]
[Authorize]
public class TimelineController(AppDbContext db, CurrentUser user) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Listar([FromQuery] Guid? blocoId, [FromQuery] string? apto, [FromQuery] string? q)
    {
        var query = db.Timeline.AsNoTracking()
            .Include(t => t.Aviso)
            .Include(t => t.Morador).ThenInclude(m => m.Bloco)
            .Where(t => t.Aviso.CondominioId == user.CondominioId);

        if (blocoId.HasValue) query = query.Where(t => t.Morador.BlocoId == blocoId);
        if (!string.IsNullOrWhiteSpace(apto)) query = query.Where(t => t.Morador.Apartamento == apto);
        if (!string.IsNullOrWhiteSpace(q)) query = query.Where(t => t.Morador.Nome.Contains(q));

        var conversas = await query
            .GroupBy(t => new { t.AvisoId, t.MoradorId })
            .Select(g => new
            {
                avisoId = g.Key.AvisoId,
                moradorId = g.Key.MoradorId,
                avisoTitulo = g.First().Aviso.Titulo,
                moradorNome = g.First().Morador.Nome,
                bloco = g.First().Morador.Bloco != null ? g.First().Morador.Bloco!.Nome : null,
                apartamento = g.First().Morador.Apartamento,
                ultimaMensagem = g.Max(x => x.CriadoEm),
                totalMensagens = g.Count()
            })
            .OrderByDescending(x => x.ultimaMensagem)
            .Take(200)
            .ToListAsync();

        return Ok(conversas);
    }

    [HttpGet("{avisoId:guid}/{moradorId:guid}")]
    public async Task<IActionResult> Thread(Guid avisoId, Guid moradorId)
    {
        var aviso = await db.Avisos.AsNoTracking().FirstOrDefaultAsync(a => a.Id == avisoId);
        if (aviso is null || aviso.CondominioId != user.CondominioId) return NotFound();

        var sou = user.Perfil == "Morador" ? user.UserId : null;
        if (user.Perfil == "Morador" && sou != moradorId) return Forbid();

        var morador = await db.Moradores.AsNoTracking().Include(m => m.Bloco).FirstOrDefaultAsync(m => m.Id == moradorId);
        if (morador is null) return NotFound();

        var msgs = await db.Timeline.AsNoTracking()
            .Where(t => t.AvisoId == avisoId && t.MoradorId == moradorId)
            .OrderBy(t => t.CriadoEm)
            .Select(t => new { t.Id, t.AutorTipo, t.AutorNome, t.Texto, t.CriadoEm })
            .ToListAsync();

        return Ok(new
        {
            aviso = new { aviso.Id, aviso.Titulo, aviso.Texto, aviso.CriadoEm, aviso.PublicadoEm },
            morador = new { morador.Id, morador.Nome, morador.Email, bloco = morador.Bloco?.Nome, morador.Apartamento },
            mensagens = msgs
        });
    }

    public record EnviarReq(string Texto);

    [HttpPost("{avisoId:guid}/{moradorId:guid}")]
    public async Task<IActionResult> Enviar(Guid avisoId, Guid moradorId, EnviarReq req)
    {
        if (string.IsNullOrWhiteSpace(req.Texto)) return BadRequest(new { erro = "Mensagem vazia" });
        var aviso = await db.Avisos.FirstOrDefaultAsync(a => a.Id == avisoId);
        if (aviso is null || aviso.CondominioId != user.CondominioId) return NotFound();

        var perfil = user.Perfil ?? "";
        AutorMensagem tipo;
        string nome;
        if (perfil == "Morador")
        {
            if (user.UserId != moradorId) return Forbid();
            var m = await db.Moradores.FindAsync(moradorId);
            tipo = AutorMensagem.Morador; nome = m?.Nome ?? "";
        }
        else
        {
            var u = await db.Usuarios.FindAsync(user.UserId);
            tipo = AutorMensagem.Sindico; nome = u?.Nome ?? "Síndico";
        }

        var msg = new TimelineMensagem
        {
            AvisoId = avisoId,
            MoradorId = moradorId,
            AutorTipo = tipo,
            AutorId = user.UserId!.Value,
            AutorNome = nome,
            Texto = req.Texto.Trim()
        };
        db.Timeline.Add(msg);
        await db.SaveChangesAsync();
        return Ok(new { msg.Id, msg.CriadoEm });
    }

    [HttpGet("{avisoId:guid}/{moradorId:guid}/pdf")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Pdf(Guid avisoId, Guid moradorId)
    {
        var aviso = await db.Avisos.AsNoTracking().Include(a => a.Condominio).FirstOrDefaultAsync(a => a.Id == avisoId);
        if (aviso is null || aviso.CondominioId != user.CondominioId) return NotFound();
        var morador = await db.Moradores.AsNoTracking().Include(m => m.Bloco).FirstOrDefaultAsync(m => m.Id == moradorId);
        if (morador is null) return NotFound();
        var msgs = await db.Timeline.AsNoTracking()
            .Where(t => t.AvisoId == avisoId && t.MoradorId == moradorId)
            .OrderBy(t => t.CriadoEm).ToListAsync();

        var sb = new StringBuilder();
        sb.Append($@"<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Timeline - {aviso.Titulo}</title>
<style>
@media print {{ body {{ margin: 0 }} .noprint {{ display: none }} }}
body {{ font-family: Arial,sans-serif; max-width: 800px; margin: 32px auto; padding: 0 24px; color: #0F172A; }}
h1 {{ font-size: 22px; margin: 0 0 4px }}
.meta {{ color: #64748B; font-size: 13px; margin-bottom: 24px }}
.aviso {{ background: #F8FAFC; border-left: 4px solid #0F172A; padding: 16px; border-radius: 4px; margin-bottom: 32px }}
.msg {{ padding: 12px 16px; border-radius: 8px; margin-bottom: 12px; max-width: 80%; }}
.msg.sindico {{ background: #DBEAFE; }}
.msg.morador {{ background: #F1F5F9; margin-left: auto; }}
.autor {{ font-weight: 600; font-size: 13px; margin-bottom: 4px }}
.data {{ color: #64748B; font-size: 11px; margin-top: 4px }}
.imprimir {{ background: #0F172A; color: #fff; padding: 8px 16px; border: 0; border-radius: 6px; cursor: pointer; }}
</style></head><body>
<button class='imprimir noprint' onclick='window.print()'>Imprimir / Salvar como PDF</button>
<h1>{aviso.Condominio.Nome}</h1>
<div class='meta'>Timeline — Aviso: <b>{System.Net.WebUtility.HtmlEncode(aviso.Titulo)}</b><br/>
Morador: {System.Net.WebUtility.HtmlEncode(morador.Nome)} {(morador.Bloco != null ? $"— {morador.Bloco.Nome}" : "")} {(string.IsNullOrEmpty(morador.Apartamento) ? "" : $"— Apto {morador.Apartamento}")}</div>
<div class='aviso'><div class='autor'>Aviso original</div>
<div>{System.Net.WebUtility.HtmlEncode(aviso.Texto).Replace("\n", "<br/>")}</div>
<div class='data'>{aviso.PublicadoEm:dd/MM/yyyy HH:mm}</div></div>");

        foreach (var m in msgs)
        {
            var cls = m.AutorTipo == AutorMensagem.Sindico ? "sindico" : "morador";
            sb.Append($"<div class='msg {cls}'><div class='autor'>{System.Net.WebUtility.HtmlEncode(m.AutorNome)}</div><div>{System.Net.WebUtility.HtmlEncode(m.Texto).Replace("\n", "<br/>")}</div><div class='data'>{m.CriadoEm:dd/MM/yyyy HH:mm}</div></div>");
        }

        sb.Append("</body></html>");
        return Content(sb.ToString(), "text/html; charset=utf-8");
    }
}
