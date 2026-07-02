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
    static readonly string[] VideosOk = { ".mp4", ".webm", ".mov" };
    const long MaxFoto = 5 * 1024 * 1024;
    const long MaxVideo = 25 * 1024 * 1024;
    const int MaxFotosPorReporte = 6;
    const int MaxFotosPorMensagem = 3;

    string AppUrl => cfg["AppUrl"] ?? "https://app.appavisos.com.br";

    static bool UrlUploadValida(string? u) =>
        !string.IsNullOrWhiteSpace(u) && u.StartsWith("/uploads/", StringComparison.Ordinal)
        && u.Length <= 300 && !u.Any(ch => ch is '"' or '\'' or '<' or '>' or ' ' or '\\');

    static List<string> FotosValidas(List<string>? fotos, int max) =>
        (fotos ?? new()).Where(UrlUploadValida).Take(max).ToList();

    [HttpGet("publico/reportes/{slug}/config")]
    public async Task<IActionResult> Config(string slug, [FromQuery] string? canal)
    {
        var cond = await db.Condominios.AsNoTracking().Where(c => c.Slug == slug && !c.Bloqueado)
            .Select(c => new { c.Id, c.Nome, c.LogoUrl, c.CorPrimaria, c.IdentificacaoObrigatoria })
            .FirstOrDefaultAsync();
        if (cond is null) return NotFound();
        var areas = await db.Areas.AsNoTracking().Where(a => a.CondominioId == cond.Id)
            .OrderBy(a => a.Ordem).Select(a => new { a.Id, a.Nome }).ToListAsync();

        if (!string.IsNullOrEmpty(canal))
        {
            var c = await db.CanaisReporte.AsNoTracking().Include(x => x.Area)
                .FirstOrDefaultAsync(x => x.Token == canal && x.CondominioId == cond.Id && x.Ativo);
            if (c is null) return NotFound(new { erro = "Canal não encontrado ou desativado" });
            return Ok(new
            {
                cond.Nome, cond.LogoUrl, cond.CorPrimaria,
                identificacaoObrigatoria = c.IdentificacaoObrigatoria,
                canalNome = c.Nome, canalDescricao = c.Descricao,
                canalAreaId = c.AreaId, canalAreaNome = c.Area?.Nome,
                areas
            });
        }

        return Ok(new { cond.Nome, cond.LogoUrl, cond.CorPrimaria, cond.IdentificacaoObrigatoria, areas });
    }

    public record CriarReporteReq(
        string Categoria, string Titulo, string Descricao, List<string>? Fotos,
        string? Nome, string? Bloco, string? Apartamento, string? Telefone, string? Email,
        Guid? AreaId, string? Canal, string? Video);

    [HttpPost("publico/reportes/{slug}")]
    [EnableRateLimiting("publico")]
    public async Task<IActionResult> Criar(string slug, CriarReporteReq req)
    {
        var cond = await db.Condominios.FirstOrDefaultAsync(c => c.Slug == slug && !c.Bloqueado);
        if (cond is null) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Titulo) || string.IsNullOrWhiteSpace(req.Descricao))
            return BadRequest(new { erro = "Título e descrição são obrigatórios" });

        var identifObrig = cond.IdentificacaoObrigatoria;
        Guid? areaId = req.AreaId;
        if (!string.IsNullOrEmpty(req.Canal))
        {
            var canal = await db.CanaisReporte.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Token == req.Canal && x.CondominioId == cond.Id && x.Ativo);
            if (canal is null) return BadRequest(new { erro = "Canal inválido" });
            identifObrig = canal.IdentificacaoObrigatoria;
            areaId ??= canal.AreaId;
        }
        if (!Enum.TryParse<CategoriaReporte>(req.Categoria, true, out var categoria) || !Enum.IsDefined(categoria))
            categoria = CategoriaReporte.Outro;
        if (categoria == CategoriaReporte.SegundaViaBoleto) identifObrig = true;

        if (identifObrig
            && (string.IsNullOrWhiteSpace(req.Nome) || string.IsNullOrWhiteSpace(req.Apartamento)))
            return BadRequest(new { erro = "Nome e apartamento são obrigatórios" });

        var fotos = FotosValidas(req.Fotos, MaxFotosPorReporte);

        string protocolo;
        var rng = new Random();
        do { protocolo = rng.Next(100000, 1000000).ToString(); }
        while (await db.Reportes.AnyAsync(x => x.Protocolo == protocolo));

        var r = new Reporte
        {
            Protocolo = protocolo,
            CondominioId = cond.Id,
            AreaId = areaId,
            Categoria = categoria,
            Titulo = req.Titulo.Trim(),
            Descricao = req.Descricao.Trim(),
            FotosJson = JsonSerializer.Serialize(fotos),
            VideoUrl = UrlUploadValida(req.Video?.Trim()) ? req.Video!.Trim() : null,
            Nome = req.Nome?.Trim(),
            Bloco = req.Bloco?.Trim(),
            Apartamento = req.Apartamento?.Trim(),
            Telefone = req.Telefone?.Trim(),
            Email = req.Email?.Trim().ToLowerInvariant()
        };
        db.Reportes.Add(r);
        db.HistoricosReporte.Add(new HistoricoReporte
        {
            ReporteId = r.Id,
            Status = StatusReporte.Aberto,
            AutorNome = r.Nome ?? "Anônimo",
            AutorPerfil = "Morador",
            Observacao = "Protocolo aberto"
        });
        await db.SaveChangesAsync();
        return Ok(new { id = r.Id, protocolo = r.Protocolo, token = r.TokenPublico, linkPublico = $"{AppUrl}/r/{r.TokenPublico}" });
    }

    [HttpPost("publico/reportes/{slug}/foto")]
    [EnableRateLimiting("publico")]
    public async Task<IActionResult> UploadFoto(string slug, IFormFile file)
    {
        var cond = await db.Condominios.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == slug && !c.Bloqueado);
        if (cond is null) return NotFound();
        return await SalvarFoto(cond.Id, file);
    }

    [HttpPost("publico/reportes/{slug}/video")]
    [EnableRateLimiting("publico")]
    [RequestSizeLimit(30_000_000)]
    public async Task<IActionResult> UploadVideo(string slug, IFormFile file)
    {
        var cond = await db.Condominios.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == slug && !c.Bloqueado);
        if (cond is null) return NotFound();
        if (file is null || file.Length == 0) return BadRequest(new { erro = "Arquivo vazio" });
        if (file.Length > MaxVideo) return BadRequest(new { erro = "Vídeo até 25MB (máx. 15 segundos)" });
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!VideosOk.Contains(ext)) return BadRequest(new { erro = "Formato inválido (mp4, webm ou mov)" });

        var subdir = $"reportes/{cond.Id}";
        var raiz = Path.Combine(env.ContentRootPath, "uploads", subdir);
        Directory.CreateDirectory(raiz);
        var nome = $"{Guid.NewGuid():N}{ext}";
        await using (var fs = System.IO.File.Create(Path.Combine(raiz, nome)))
            await file.CopyToAsync(fs);
        return Ok(new { url = $"/uploads/{subdir}/{nome}" });
    }

    async Task<IActionResult> SalvarFoto(Guid condominioId, IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { erro = "Arquivo vazio" });
        if (file.Length > MaxFoto) return BadRequest(new { erro = "Foto até 5MB" });
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!ImagensOk.Contains(ext)) return BadRequest(new { erro = "Formato inválido" });

        var subdir = $"reportes/{condominioId}";
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
        if (Enum.TryParse<StatusReporte>(status, true, out var s) && Enum.IsDefined(s)) q = q.Where(r => r.Status == s);
        if (Enum.TryParse<CategoriaReporte>(categoria, true, out var c) && Enum.IsDefined(c)) q = q.Where(r => r.Categoria == c);

        var lista = await q.OrderByDescending(r => r.CriadoEm).Take(200)
            .Select(r => new
            {
                r.Id, r.Protocolo, r.Categoria, r.Titulo, r.Status, r.Nome, r.Bloco, r.Apartamento,
                r.CriadoEm, r.RespondidoEm, area = r.Area != null ? r.Area.Nome : null,
                temFotos = r.FotosJson.Length > 2, temVideo = r.VideoUrl != null
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
        var historico = await db.HistoricosReporte.AsNoTracking()
            .Where(h => h.ReporteId == r.Id).OrderBy(h => h.CriadoEm)
            .Select(h => new { h.Status, h.AutorNome, h.AutorPerfil, h.Observacao, h.CriadoEm })
            .ToListAsync();
        return Ok(new
        {
            r.Id, r.Protocolo, r.Categoria, r.Titulo, r.Descricao, r.Status,
            r.Nome, r.Bloco, r.Apartamento, r.Telefone, r.Email,
            area = r.Area?.Nome, r.CriadoEm, r.Resposta, r.RespondidoEm, r.RespondidoPor,
            fotos, video = r.VideoUrl, historico,
            mensagens = await ListarMensagens(r.Id),
            linkPublico = $"{AppUrl}/r/{r.TokenPublico}",
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
        var statusAnterior = r.Status;
        r.Resposta = req.Resposta.Trim();
        r.RespondidoEm = DateTime.UtcNow;
        r.RespondidoPor = (await db.Usuarios.FindAsync(user.UserId))?.Nome ?? "Síndico";
        if (r.Status == StatusReporte.Aberto) r.Status = StatusReporte.EmAnalise;
        if (r.Status != statusAnterior)
        {
            db.HistoricosReporte.Add(new HistoricoReporte
            {
                ReporteId = r.Id, Status = r.Status,
                AutorNome = r.RespondidoPor!, AutorPerfil = user.Perfil ?? "Sindico",
                Observacao = "Resposta enviada"
            });
        }
        await db.SaveChangesAsync();

        if (!string.IsNullOrEmpty(r.Email))
        {
            var assunto = $"Resposta — {r.Titulo}";
            var html = $@"<div style='font-family:Inter,Arial,sans-serif;max-width:560px;margin:24px auto;padding:24px;color:#0F172A'>
<h2>{System.Net.WebUtility.HtmlEncode(r.Condominio.Nome)}</h2>
<p>Olá{(string.IsNullOrEmpty(r.Nome) ? "" : ", " + System.Net.WebUtility.HtmlEncode(r.Nome))}, sua mensagem sobre <b>{System.Net.WebUtility.HtmlEncode(r.Titulo)}</b> foi respondida.</p>
<p style='color:#64748B;font-size:13px'>Protocolo: <b>{r.Protocolo}</b></p>
<div style='background:#F1F5F9;padding:16px;border-radius:8px;margin:16px 0'>{System.Net.WebUtility.HtmlEncode(r.Resposta).Replace("\n", "<br/>")}</div>
<p style='color:#64748B;font-size:13px'>— {System.Net.WebUtility.HtmlEncode(r.RespondidoPor ?? "")}</p>
<p style='color:#64748B;font-size:12px'><a href='{AppUrl}/r/{r.TokenPublico}'>Ver registro completo</a></p></div>";
            try { await email.EnviarAsync(r.Email, assunto, html); } catch { }
        }
        return Ok(new { r.Id, r.Status, r.RespondidoEm });
    }

    public record MudarStatusReq(string Status, string? Observacao);

    [HttpPost("reportes/{id:guid}/status")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> MudarStatus(Guid id, MudarStatusReq req)
    {
        if (!Enum.TryParse<StatusReporte>(req.Status, true, out var novo) || !Enum.IsDefined(novo))
            return BadRequest(new { erro = "Status inválido" });
        var r = await db.Reportes.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (r is null) return NotFound();
        if (r.Status == novo) return NoContent();
        r.Status = novo;
        var autor = (await db.Usuarios.FindAsync(user.UserId))?.Nome ?? "Síndico";
        db.HistoricosReporte.Add(new HistoricoReporte
        {
            ReporteId = r.Id, Status = novo,
            AutorNome = autor, AutorPerfil = user.Perfil ?? "Sindico",
            Observacao = req.Observacao?.Trim()
        });
        await db.SaveChangesAsync();
        return Ok(new { r.Status });
    }

    public record EnviarMensagemReq(string? Texto, List<string>? Fotos);

    async Task<List<object>> ListarMensagens(Guid reporteId)
    {
        var msgs = await db.MensagensReporte.AsNoTracking()
            .Where(m => m.ReporteId == reporteId).OrderBy(m => m.CriadoEm).Take(500).ToListAsync();
        return msgs.Select(m => (object)new
        {
            m.Id, m.AutorNome, m.AutorPerfil, m.Texto,
            fotos = JsonSerializer.Deserialize<List<string>>(m.FotosJson) ?? new(),
            m.CriadoEm
        }).ToList();
    }

    [HttpGet("reportes/{id:guid}/mensagens")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Mensagens(Guid id)
    {
        var existe = await db.Reportes.AsNoTracking().AnyAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (!existe) return NotFound();
        return Ok(await ListarMensagens(id));
    }

    [HttpPost("reportes/{id:guid}/mensagens")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> EnviarMensagem(Guid id, EnviarMensagemReq req)
    {
        var fotos = FotosValidas(req.Fotos, MaxFotosPorMensagem);
        if (string.IsNullOrWhiteSpace(req.Texto) && fotos.Count == 0)
            return BadRequest(new { erro = "Mensagem vazia" });
        var r = await db.Reportes.Include(x => x.Condominio).FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (r is null) return NotFound();

        var limite = DateTime.UtcNow.AddMinutes(-10);
        var notificar = !string.IsNullOrEmpty(r.Email) && !await db.MensagensReporte
            .AnyAsync(m => m.ReporteId == r.Id && m.AutorPerfil != "Morador" && m.CriadoEm > limite);

        var autor = (await db.Usuarios.FindAsync(user.UserId))?.Nome ?? "Síndico";
        db.MensagensReporte.Add(new MensagemReporte
        {
            ReporteId = r.Id,
            AutorNome = autor,
            AutorPerfil = user.Perfil ?? "Sindico",
            Texto = (req.Texto ?? "").Trim(),
            FotosJson = JsonSerializer.Serialize(fotos)
        });
        await db.SaveChangesAsync();

        if (notificar)
        {
            var html = $@"<div style='font-family:Inter,Arial,sans-serif;max-width:560px;margin:24px auto;padding:24px;color:#0F172A'>
<h2>{System.Net.WebUtility.HtmlEncode(r.Condominio.Nome)}</h2>
<p>Olá{(string.IsNullOrEmpty(r.Nome) ? "" : ", " + System.Net.WebUtility.HtmlEncode(r.Nome))}, você recebeu uma nova mensagem sobre <b>{System.Net.WebUtility.HtmlEncode(r.Titulo)}</b>.</p>
<p style='color:#64748B;font-size:13px'>Protocolo: <b>{r.Protocolo}</b></p>
{(string.IsNullOrWhiteSpace(req.Texto) ? "" : $"<div style='background:#F1F5F9;padding:16px;border-radius:8px;margin:16px 0'>{System.Net.WebUtility.HtmlEncode(req.Texto.Trim()).Replace("\n", "<br/>")}</div>")}
<p style='color:#64748B;font-size:13px'>— {System.Net.WebUtility.HtmlEncode(autor)}</p>
<p style='color:#64748B;font-size:12px'><a href='{AppUrl}/r/{r.TokenPublico}'>Abrir o chat e responder</a></p></div>";
            try { await email.EnviarAsync(r.Email!, $"Nova mensagem — {r.Titulo}", html); } catch { }
        }
        return Ok(await ListarMensagens(id));
    }

    [HttpPost("reportes/{id:guid}/mensagens/foto")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> UploadFotoMensagem(Guid id, IFormFile file)
    {
        var r = await db.Reportes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (r is null) return NotFound();
        return await SalvarFoto(r.CondominioId, file);
    }

    [HttpGet("publico/r/{token}/chat")]
    public async Task<IActionResult> ChatPublico(string token)
    {
        var r = await db.Reportes.AsNoTracking().FirstOrDefaultAsync(x => x.TokenPublico == token);
        if (r is null) return NotFound();
        return Ok(new { r.Protocolo, status = r.Status.ToString(), mensagens = await ListarMensagens(r.Id) });
    }

    [HttpPost("publico/r/{token}/mensagens")]
    [EnableRateLimiting("publico")]
    public async Task<IActionResult> EnviarMensagemPublico(string token, EnviarMensagemReq req)
    {
        var fotos = FotosValidas(req.Fotos, MaxFotosPorMensagem);
        if (string.IsNullOrWhiteSpace(req.Texto) && fotos.Count == 0)
            return BadRequest(new { erro = "Mensagem vazia" });
        var r = await db.Reportes.Include(x => x.Condominio).FirstOrDefaultAsync(x => x.TokenPublico == token);
        if (r is null) return NotFound();
        if (r.Status == StatusReporte.Arquivado)
            return BadRequest(new { erro = "Este protocolo foi arquivado e não aceita novas mensagens" });

        var limite = DateTime.UtcNow.AddMinutes(-10);
        var notificar = !await db.MensagensReporte
            .AnyAsync(m => m.ReporteId == r.Id && m.AutorPerfil == "Morador" && m.CriadoEm > limite);

        var texto = (req.Texto ?? "").Trim();
        if (texto.Length > 2000) texto = texto[..2000];
        db.MensagensReporte.Add(new MensagemReporte
        {
            ReporteId = r.Id,
            AutorNome = string.IsNullOrWhiteSpace(r.Nome) ? "Morador" : r.Nome,
            AutorPerfil = "Morador",
            Texto = texto,
            FotosJson = JsonSerializer.Serialize(fotos)
        });
        await db.SaveChangesAsync();

        if (notificar)
        {
            var destinos = await db.Usuarios.AsNoTracking()
                .Where(u => u.CondominioId == r.CondominioId
                    && (u.Perfil == PerfilUsuario.Sindico || u.Perfil == PerfilUsuario.Subsindico))
                .Select(u => u.Email).ToListAsync();
            var html = $@"<div style='font-family:Inter,Arial,sans-serif;max-width:560px;margin:24px auto;padding:24px;color:#0F172A'>
<h2>{System.Net.WebUtility.HtmlEncode(r.Condominio.Nome)}</h2>
<p>Nova mensagem do morador no protocolo <b>{r.Protocolo}</b> — {System.Net.WebUtility.HtmlEncode(r.Titulo)}.</p>
{(string.IsNullOrEmpty(texto) ? "" : $"<div style='background:#F1F5F9;padding:16px;border-radius:8px;margin:16px 0'>{System.Net.WebUtility.HtmlEncode(texto).Replace("\n", "<br/>")}</div>")}
<p style='color:#64748B;font-size:12px'><a href='{AppUrl}/painel/solicitacoes'>Abrir no painel e responder</a></p></div>";
            foreach (var d in destinos)
                try { await email.EnviarAsync(d, $"Nova mensagem — protocolo {r.Protocolo}", html); } catch { }
        }
        return Ok(await ListarMensagens(r.Id));
    }

    [HttpPost("publico/r/{token}/foto")]
    [EnableRateLimiting("publico")]
    public async Task<IActionResult> UploadFotoChatPublico(string token, IFormFile file)
    {
        var r = await db.Reportes.AsNoTracking().FirstOrDefaultAsync(x => x.TokenPublico == token);
        if (r is null) return NotFound();
        return await SalvarFoto(r.CondominioId, file);
    }

    [HttpGet("reportes/relatorio")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Relatorio([FromQuery] DateTime? de, [FromQuery] DateTime? ate,
        [FromQuery] string? categoria, [FromQuery] string? status, [FromQuery] string? bloco)
    {
        var q = db.Reportes.AsNoTracking().Where(r => r.CondominioId == user.CondominioId);
        if (de.HasValue)
        {
            var d = DateTime.SpecifyKind(de.Value.Date, DateTimeKind.Utc);
            q = q.Where(r => r.CriadoEm >= d);
        }
        if (ate.HasValue)
        {
            var d = DateTime.SpecifyKind(ate.Value.Date, DateTimeKind.Utc).AddDays(1);
            q = q.Where(r => r.CriadoEm < d);
        }
        if (Enum.TryParse<CategoriaReporte>(categoria, true, out var c) && Enum.IsDefined(c)) q = q.Where(r => r.Categoria == c);
        if (Enum.TryParse<StatusReporte>(status, true, out var s) && Enum.IsDefined(s)) q = q.Where(r => r.Status == s);
        if (!string.IsNullOrWhiteSpace(bloco))
        {
            var b = bloco.Trim().ToLower();
            q = q.Where(r => r.Bloco != null && r.Bloco.ToLower() == b);
        }

        var reportes = await q.OrderByDescending(r => r.CriadoEm).Take(2000)
            .Select(r => new
            {
                r.Id, r.Protocolo, r.Categoria, r.Titulo, r.Status,
                r.Nome, r.Bloco, r.Apartamento, Area = r.Area != null ? r.Area.Nome : null,
                r.CriadoEm
            }).ToListAsync();

        var ids = reportes.Select(r => r.Id).ToList();
        var historicos = await db.HistoricosReporte.AsNoTracking()
            .Where(h => ids.Contains(h.ReporteId))
            .Select(h => new { h.ReporteId, h.Status, h.AutorNome, h.AutorPerfil, h.CriadoEm })
            .ToListAsync();
        var porReporte = historicos.GroupBy(h => h.ReporteId).ToDictionary(g => g.Key, g => g.ToList());

        static double? MinutosEntre(DateTime? inicio, DateTime? fim) =>
            inicio.HasValue && fim.HasValue ? Math.Round((fim.Value - inicio.Value).TotalMinutes, 1) : null;

        var linhas = reportes.Select(r =>
        {
            porReporte.TryGetValue(r.Id, out var hs);
            var analise = hs?.Where(h => h.Status == StatusReporte.EmAnalise).OrderBy(h => h.CriadoEm).FirstOrDefault();
            var execucao = hs?.Where(h => h.Status == StatusReporte.EmExecucao).OrderBy(h => h.CriadoEm).FirstOrDefault();
            var fim = hs?.Where(h => h.Status == StatusReporte.Finalizado).OrderBy(h => h.CriadoEm).FirstOrDefault();
            return new
            {
                r.Protocolo,
                categoria = r.Categoria.ToString(),
                r.Titulo,
                status = r.Status.ToString(),
                r.Nome, r.Bloco, r.Apartamento, r.Area,
                abertoEm = r.CriadoEm,
                emAnaliseEm = analise?.CriadoEm,
                emAnalisePor = analise?.AutorNome,
                emAnalisePerfil = analise?.AutorPerfil,
                emExecucaoEm = execucao?.CriadoEm,
                emExecucaoPor = execucao?.AutorNome,
                finalizadoEm = fim?.CriadoEm,
                finalizadoPor = fim?.AutorNome,
                finalizadoPerfil = fim?.AutorPerfil,
                minAbertoParaAnalise = MinutosEntre(r.CriadoEm, analise?.CriadoEm),
                minAnaliseParaExecucao = MinutosEntre(analise?.CriadoEm, execucao?.CriadoEm),
                minAbertoParaFinalizado = MinutosEntre(r.CriadoEm, fim?.CriadoEm)
            };
        }).ToList();

        static double? Media(IEnumerable<double?> valores)
        {
            var v = valores.Where(x => x.HasValue).Select(x => x!.Value).ToList();
            return v.Count == 0 ? null : Math.Round(v.Average(), 1);
        }

        return Ok(new
        {
            total = linhas.Count,
            porStatus = linhas.GroupBy(l => l.status).ToDictionary(g => g.Key, g => g.Count()),
            porCategoria = linhas.GroupBy(l => l.categoria).ToDictionary(g => g.Key, g => g.Count()),
            porBloco = linhas.Where(l => !string.IsNullOrEmpty(l.Bloco)).GroupBy(l => l.Bloco!).ToDictionary(g => g.Key, g => g.Count()),
            tempoMedioMin = new
            {
                abertoParaAnalise = Media(linhas.Select(l => l.minAbertoParaAnalise)),
                analiseParaExecucao = Media(linhas.Select(l => l.minAnaliseParaExecucao)),
                abertoParaFinalizado = Media(linhas.Select(l => l.minAbertoParaFinalizado))
            },
            linhas
        });
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
        return Content(RenderHtml(r, chat: true), "text/html; charset=utf-8");
    }

    [HttpGet("publico/protocolo/{numero}")]
    public async Task<IActionResult> ConsultarProtocolo(string numero)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(numero ?? "", @"^\d{6}$"))
            return BadRequest(new { erro = "Protocolo deve ter 6 dígitos" });
        var r = await db.Reportes.AsNoTracking().Include(x => x.Area).Include(x => x.Condominio)
            .FirstOrDefaultAsync(x => x.Protocolo == numero);
        if (r is null) return NotFound(new { erro = "Protocolo não encontrado" });
        var historico = await db.HistoricosReporte.AsNoTracking()
            .Where(h => h.ReporteId == r.Id).OrderBy(h => h.CriadoEm)
            .Select(h => new { status = h.Status.ToString(), h.AutorNome, h.AutorPerfil, h.Observacao, h.CriadoEm })
            .ToListAsync();
        return Ok(new
        {
            r.Protocolo, r.Titulo, status = r.Status.ToString(), categoria = r.Categoria.ToString(),
            area = r.Area?.Nome, condominio = r.Condominio.Nome,
            r.CriadoEm, r.Resposta, r.RespondidoEm, r.RespondidoPor,
            historico,
            linkCompleto = $"{AppUrl}/r/{r.TokenPublico}"
        });
    }

    string RenderHtml(Reporte r, bool chat = false)
    {
        var fotos = JsonSerializer.Deserialize<List<string>>(r.FotosJson) ?? new();
        var historico = db.HistoricosReporte.AsNoTracking()
            .Where(h => h.ReporteId == r.Id).OrderBy(h => h.CriadoEm).ToList();
        var sb = new StringBuilder();
        var cat = r.Categoria switch
        {
            CategoriaReporte.Ocorrencia => "Ocorrência",
            CategoriaReporte.Manutencao => "Manutenção",
            CategoriaReporte.Reclamacao => "Reclamação",
            CategoriaReporte.Sugestao => "Sugestão",
            CategoriaReporte.Solicitacao => "Solicitação",
            CategoriaReporte.SegundaViaBoleto => "2ª via de boleto",
            CategoriaReporte.Informacao => "Informação",
            _ => "Outro"
        };
        var stAtual = r.Status switch
        {
            StatusReporte.Aberto => ("Aberto", "#F59E0B"),
            StatusReporte.EmAnalise => ("Em análise", "#8B5CF6"),
            StatusReporte.EmExecucao => ("Em execução", "#3B82F6"),
            StatusReporte.Finalizado => ("Finalizado", "#10B981"),
            _ => ("Arquivado", "#64748B")
        };
        sb.Append($@"<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Protocolo {r.Protocolo} — {System.Net.WebUtility.HtmlEncode(r.Condominio.Nome)}</title>
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
<div style='font-size:12px;color:#64748B;letter-spacing:0.1em;text-transform:uppercase'>Protocolo</div>
<div style='font-size:28px;font-weight:700;letter-spacing:0.15em;margin-bottom:8px'>{r.Protocolo}</div>
<h1>{System.Net.WebUtility.HtmlEncode(r.Titulo)}</h1>
<div><span class='cat'>{cat}</span> <span class='cat' style='background:{stAtual.Item2}'>{stAtual.Item1}</span>{(r.Area != null ? $" · {System.Net.WebUtility.HtmlEncode(r.Area.Nome)}" : "")}</div>
<div class='meta'>{System.Net.WebUtility.HtmlEncode(r.Condominio.Nome)} — {r.CriadoEm:dd/MM/yyyy HH:mm}</div>
<div class='box'><b>Descrição</b><div style='margin-top:6px'>{System.Net.WebUtility.HtmlEncode(r.Descricao).Replace("\n", "<br/>")}</div></div>");
        if (fotos.Count > 0)
        {
            sb.Append("<div class='box'><b>Fotos</b><div class='fotos' style='margin-top:8px'>");
            foreach (var f in fotos) sb.Append($"<img src='{System.Net.WebUtility.HtmlEncode(f)}' alt=''/>");
            sb.Append("</div></div>");
        }
        if (!string.IsNullOrEmpty(r.VideoUrl))
        {
            sb.Append($"<div class='box'><b>Vídeo</b><div style='margin-top:8px'><video src='{System.Net.WebUtility.HtmlEncode(r.VideoUrl)}' controls playsinline style='width:100%;max-height:420px;border-radius:8px;background:#000'></video></div></div>");
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
        if (historico.Count > 0)
        {
            sb.Append("<div class='box'><b>Histórico</b><div style='margin-top:8px;border-left:2px solid #E2E8F0;padding-left:14px'>");
            foreach (var h in historico)
            {
                var st = h.Status switch
                {
                    StatusReporte.Aberto => ("Aberto", "#F59E0B"),
                    StatusReporte.EmAnalise => ("Em análise", "#8B5CF6"),
                    StatusReporte.EmExecucao => ("Em execução", "#3B82F6"),
                    StatusReporte.Finalizado => ("Finalizado", "#10B981"),
                    _ => ("Arquivado", "#64748B")
                };
                sb.Append($@"<div style='margin-bottom:10px;position:relative'>
<span style='display:inline-block;padding:2px 8px;border-radius:999px;background:{st.Item2};color:#fff;font-size:11px;font-weight:600'>{st.Item1}</span>
<div style='font-size:13px;margin-top:4px'>{System.Net.WebUtility.HtmlEncode(h.AutorNome)} ({System.Net.WebUtility.HtmlEncode(h.AutorPerfil)}) — {h.CriadoEm:dd/MM/yyyy HH:mm}</div>
{(string.IsNullOrEmpty(h.Observacao) ? "" : $"<div style='font-size:13px;color:#475569'>{System.Net.WebUtility.HtmlEncode(h.Observacao)}</div>")}
</div>");
            }
            sb.Append("</div></div>");
        }
        if (chat)
        {
            sb.Append(@"<div class='box noprint'><b>Chat com a administração</b>
<div id='msgs' style='margin-top:10px;max-height:420px;overflow-y:auto'></div>
<div id='fprev' style='display:flex;gap:8px;margin-top:8px;flex-wrap:wrap'></div>
<textarea id='txt' rows='2' maxlength='2000' placeholder='Escreva sua mensagem...' style='width:100%;box-sizing:border-box;margin-top:10px;padding:10px;border:1px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:14px'></textarea>
<div style='display:flex;gap:8px;margin-top:8px'>
<input type='file' id='file' accept='image/*' multiple style='display:none'/>
<button class='btn sec' onclick='document.getElementById(""file"").click()'>Anexar foto</button>
<button class='btn' id='send'>Enviar</button>
</div></div>
<script>
var TK='" + r.TokenPublico + @"';
var fotos=[];
function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
function renderMsgs(ms){
 var el=document.getElementById('msgs');
 if(!ms.length){el.innerHTML='<div style=""color:#94A3B8;font-size:13px"">Nenhuma mensagem ainda. Envie a primeira!</div>';return;}
 el.innerHTML=ms.map(function(m){
  var mine=m.autorPerfil==='Morador';
  var fs=(m.fotos||[]).map(function(f){var u=encodeURI(f);return '<a href=""'+u+'"" target=""_blank""><img src=""'+u+'"" style=""width:90px;height:90px;object-fit:cover;border-radius:6px;margin:6px 4px 0 0;border:1px solid #E2E8F0""/></a>';}).join('');
  var d=new Date(m.criadoEm);
  return '<div style=""margin-bottom:10px;padding:10px 12px;border-radius:10px;max-width:85%;'+(mine?'background:#DBEAFE;margin-left:auto':'background:#F1F5F9')+'"">'
   +'<div style=""font-size:11px;color:#64748B;font-weight:600"">'+esc(m.autorNome)+' · '+esc(m.autorPerfil)+'</div>'
   +(m.texto?'<div style=""font-size:14px;margin-top:2px;white-space:pre-wrap"">'+esc(m.texto)+'</div>':'')
   +fs
   +'<div style=""font-size:11px;color:#94A3B8;margin-top:4px"">'+d.toLocaleString('pt-BR')+'</div></div>';
 }).join('');
 el.scrollTop=el.scrollHeight;
}
function carregarChat(){
 fetch('/api/publico/r/'+TK+'/chat').then(function(r){return r.json();}).then(function(d){renderMsgs(d.mensagens||[]);}).catch(function(){});
}
function renderPrev(){
 document.getElementById('fprev').innerHTML=fotos.map(function(f,i){
  return '<span style=""position:relative;display:inline-block""><img src=""'+encodeURI(f)+'"" style=""width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #E2E8F0""/><button onclick=""removerFoto('+i+')"" style=""position:absolute;top:-6px;right:-6px;background:#EF4444;color:#fff;border:0;border-radius:999px;width:18px;height:18px;font-size:11px;cursor:pointer;line-height:1"">x</button></span>';
 }).join('');
}
function removerFoto(i){fotos.splice(i,1);renderPrev();}
function comprimir(f,cb){
 if(f.size<=1500000){cb(f);return;}
 var url=URL.createObjectURL(f);var img=new Image();
 img.onload=function(){URL.revokeObjectURL(url);var MAX=1920;var w=img.width,h=img.height;
  if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}
  var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
  c.toBlob(function(b){cb(b||f);},'image/jpeg',0.82);};
 img.onerror=function(){URL.revokeObjectURL(url);cb(f);};
 img.src=url;
}
document.getElementById('file').addEventListener('change',function(){
 var files=Array.prototype.slice.call(this.files).slice(0,3-fotos.length);
 files.forEach(function(f){
  comprimir(f,function(b){
   var fd=new FormData();fd.append('file',b,'foto.jpg');
   fetch('/api/publico/r/'+TK+'/foto',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(d){
    if(d.url){fotos.push(d.url);renderPrev();}else if(d&&d.erro){alert(d.erro);}
   }).catch(function(){});
  });
 });
 this.value='';
});
document.getElementById('send').addEventListener('click',function(){
 var t=document.getElementById('txt').value.trim();
 if(!t&&!fotos.length)return;
 var btn=this;btn.disabled=true;
 fetch('/api/publico/r/'+TK+'/mensagens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({texto:t,fotos:fotos})})
  .then(function(r){return r.json();}).then(function(ms){if(Array.isArray(ms)){renderMsgs(ms);document.getElementById('txt').value='';fotos=[];renderPrev();}else if(ms&&ms.erro){alert(ms.erro);}})
  .catch(function(){}).then(function(){btn.disabled=false;});
});
carregarChat();
setInterval(carregarChat,20000);
</script>");
        }
        sb.Append("</body></html>");
        return sb.ToString();
    }
}
