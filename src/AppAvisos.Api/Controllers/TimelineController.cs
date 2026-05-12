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

    public record FeedFiltros(string? tipo, string? subtipo, string? q, string? protocolo, DateTime? de, DateTime? ate);

    record FeedItem(string Tipo, Guid Id, string Subtipo, string Titulo, string Resumo,
        DateTime CriadoEm, string? Status, string? Protocolo,
        string? MoradorNome, string? Bloco, string? Apartamento, string? Link);

    [HttpGet("feed")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Feed([FromQuery] FeedFiltros f)
    {
        var itens = await BuscarFeed(f);
        return Ok(itens);
    }

    [HttpGet("relatorio")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Relatorio([FromQuery] FeedFiltros f)
    {
        var itens = await BuscarFeed(f);
        var cond = await db.Condominios.AsNoTracking().FirstOrDefaultAsync(c => c.Id == user.CondominioId);
        var sb = new StringBuilder();
        var filtrosTexto = MontarFiltrosTexto(f);
        sb.Append($@"<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'><title>Relatório — {System.Net.WebUtility.HtmlEncode(cond?.Nome ?? "")}</title>
<style>
@media print {{ .noprint {{ display:none }} body {{ margin:0 }} @page {{ size: A4; margin: 18mm }} }}
body {{ font-family: Inter,Arial,sans-serif; max-width: 880px; margin: 24px auto; padding: 0 24px; color: #0F172A; }}
.cab {{ display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid #0F172A; padding-bottom:10px; margin-bottom:18px }}
.titulo {{ font-size: 22px; font-weight:700 }}
.sub {{ color:#64748B; font-size:13px }}
.filtros {{ background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 14px; font-size:12px; color:#475569; margin-bottom:18px }}
table {{ width:100%; border-collapse:collapse; font-size:13px }}
th, td {{ text-align:left; padding:8px 10px; border-bottom:1px solid #E2E8F0; vertical-align:top }}
th {{ background:#F1F5F9; font-weight:600; color:#334155; font-size:11px; text-transform:uppercase; letter-spacing:0.05em }}
tr:nth-child(even) td {{ background:#FAFAFA }}
.badge {{ display:inline-block; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:600 }}
.aviso {{ background:#DBEAFE; color:#1E40AF }}
.reporte {{ background:#FEF3C7; color:#92400E }}
.st-Aberto {{ background:#FEF3C7; color:#92400E }}
.st-EmExecucao {{ background:#DBEAFE; color:#1E40AF }}
.st-Finalizado {{ background:#D1FAE5; color:#065F46 }}
.st-Arquivado {{ background:#E2E8F0; color:#475569 }}
.btn {{ background:#0F172A; color:#fff; padding:8px 16px; border:0; border-radius:6px; cursor:pointer; font-size:13px }}
.foot {{ margin-top:24px; color:#94A3B8; font-size:11px; text-align:right }}
</style></head><body>
<div class='noprint' style='margin-bottom:16px'><button class='btn' onclick='window.print()'>Imprimir / Salvar como PDF</button></div>
<div class='cab'>
  <div>
    <div class='titulo'>Relatório de timeline</div>
    <div class='sub'>{System.Net.WebUtility.HtmlEncode(cond?.Nome ?? "")}</div>
  </div>
  <div class='sub'>Gerado em {DateTime.UtcNow.AddHours(-3):dd/MM/yyyy HH:mm}<br/>Total: {itens.Count} registro(s)</div>
</div>
<div class='filtros'><b>Filtros:</b> {filtrosTexto}</div>
<table>
<thead><tr><th>Data</th><th>Tipo</th><th>Protocolo</th><th>Título</th><th>Morador</th><th>Status</th></tr></thead>
<tbody>");
        foreach (var i in itens)
        {
            var badgeTipo = i.Tipo == "aviso" ? "aviso" : "reporte";
            sb.Append($@"<tr>
<td>{i.CriadoEm.AddHours(-3):dd/MM/yyyy HH:mm}</td>
<td><span class='badge {badgeTipo}'>{System.Net.WebUtility.HtmlEncode(i.Subtipo)}</span></td>
<td>{(string.IsNullOrEmpty(i.Protocolo) ? "—" : i.Protocolo)}</td>
<td>{System.Net.WebUtility.HtmlEncode(i.Titulo)}<div style='color:#64748B;font-size:11px'>{System.Net.WebUtility.HtmlEncode(i.Resumo)}</div></td>
<td>{System.Net.WebUtility.HtmlEncode(i.MoradorNome ?? "—")}{(string.IsNullOrEmpty(i.Apartamento) ? "" : $"<div style='color:#64748B;font-size:11px'>{System.Net.WebUtility.HtmlEncode(i.Bloco ?? "")} {System.Net.WebUtility.HtmlEncode(i.Apartamento ?? "")}</div>")}</td>
<td>{(string.IsNullOrEmpty(i.Status) ? "—" : $"<span class='badge st-{i.Status}'>{i.Status}</span>")}</td>
</tr>");
        }
        sb.Append($@"</tbody></table>
<div class='foot'>AppAvisos · {cond?.Nome} · documento gerado pelo sistema</div>
</body></html>");
        return Content(sb.ToString(), "text/html; charset=utf-8");
    }

    string MontarFiltrosTexto(FeedFiltros f)
    {
        var l = new List<string>();
        if (!string.IsNullOrEmpty(f.tipo)) l.Add($"tipo={f.tipo}");
        if (!string.IsNullOrEmpty(f.subtipo)) l.Add($"subtipo={f.subtipo}");
        if (!string.IsNullOrEmpty(f.protocolo)) l.Add($"protocolo={f.protocolo}");
        if (!string.IsNullOrEmpty(f.q)) l.Add($"busca=\"{f.q}\"");
        if (f.de.HasValue) l.Add($"de {f.de:dd/MM/yyyy}");
        if (f.ate.HasValue) l.Add($"até {f.ate:dd/MM/yyyy}");
        return l.Count == 0 ? "nenhum" : string.Join(" · ", l);
    }

    async Task<List<FeedItem>> BuscarFeed(FeedFiltros f)
    {
        var lista = new List<FeedItem>();
        var de = f.de;
        var ate = f.ate?.AddDays(1);
        var qLow = f.q?.Trim().ToLowerInvariant();

        if (!string.IsNullOrEmpty(f.protocolo))
        {
            f = f with { tipo = "reporte" };
        }

        if (f.tipo != "reporte")
        {
            var q = from a in db.Avisos.AsNoTracking()
                    where a.CondominioId == user.CondominioId && a.ArquivadoEm == null
                    join m in db.Moradores.Include(x => x.Bloco) on a.MoradorId equals m.Id into mj
                    from m in mj.DefaultIfEmpty()
                    select new { a, m };
            if (de.HasValue) q = q.Where(x => x.a.CriadoEm >= de);
            if (ate.HasValue) q = q.Where(x => x.a.CriadoEm < ate);
            if (!string.IsNullOrEmpty(f.subtipo) && Enum.TryParse<TipoMensagem>(f.subtipo, true, out var t))
                q = q.Where(x => x.a.Tipo == t);
            if (!string.IsNullOrEmpty(qLow))
                q = q.Where(x => x.a.Titulo.ToLower().Contains(qLow) || x.a.Texto.ToLower().Contains(qLow));
            var avisos = await q.OrderByDescending(x => x.a.CriadoEm).Take(500)
                .Select(x => new FeedItem(
                    "aviso", x.a.Id, x.a.Tipo.ToString(), x.a.Titulo,
                    x.a.Texto.Length > 120 ? x.a.Texto.Substring(0, 120) + "…" : x.a.Texto,
                    x.a.CriadoEm, x.a.PublicadoEm == null ? "Rascunho" : "Publicado", null,
                    x.m != null ? x.m.Nome : null,
                    x.m != null && x.m.Bloco != null ? x.m.Bloco.Nome : null,
                    x.m != null ? x.m.Apartamento : null,
                    $"/painel/avisos/{x.a.Id}")).ToListAsync();
            lista.AddRange(avisos);
        }

        if (f.tipo != "aviso")
        {
            var q = db.Reportes.AsNoTracking().Include(r => r.Area)
                .Where(r => r.CondominioId == user.CondominioId);
            if (!string.IsNullOrEmpty(f.protocolo)) q = q.Where(r => r.Protocolo == f.protocolo);
            if (de.HasValue) q = q.Where(r => r.CriadoEm >= de);
            if (ate.HasValue) q = q.Where(r => r.CriadoEm < ate);
            if (!string.IsNullOrEmpty(f.subtipo) && Enum.TryParse<CategoriaReporte>(f.subtipo, true, out var c))
                q = q.Where(r => r.Categoria == c);
            if (!string.IsNullOrEmpty(qLow))
                q = q.Where(r => r.Titulo.ToLower().Contains(qLow) || r.Descricao.ToLower().Contains(qLow)
                    || (r.Nome != null && r.Nome.ToLower().Contains(qLow)));
            var reps = await q.OrderByDescending(r => r.CriadoEm).Take(500)
                .Select(r => new FeedItem(
                    "reporte", r.Id, r.Categoria.ToString(), r.Titulo,
                    r.Descricao.Length > 120 ? r.Descricao.Substring(0, 120) + "…" : r.Descricao,
                    r.CriadoEm, r.Status.ToString(), r.Protocolo,
                    r.Nome, r.Bloco, r.Apartamento,
                    $"/painel/reportes#{r.Id}")).ToListAsync();
            lista.AddRange(reps);
        }

        return lista.OrderByDescending(i => i.CriadoEm).Take(500).ToList();
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
