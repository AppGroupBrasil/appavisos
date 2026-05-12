using System.Security.Cryptography;
using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/avisos")]
[Authorize]
public class AvisosController(AppDbContext db, CurrentUser user) : ControllerBase
{
    public record CriarAvisoReq(
        string Titulo, string Texto, EscopoAviso Escopo, Guid? BlocoId, Guid? MoradorId, Guid? AreaId,
        TemplateAviso Template, TipoMensagem Tipo, Guid? CategoriaId, bool Urgente, bool Fixado,
        DateTime? PublicarEm, DateTime? ValidoAte,
        string? AnexoUrl, string? AnexoNome, long? AnexoTamanho);

    [HttpPost]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Criar(CriarAvisoReq req)
    {
        if (string.IsNullOrWhiteSpace(req.Titulo)) return BadRequest(new { erro = "Título obrigatório" });
        if (req.Escopo == EscopoAviso.Bloco && !req.BlocoId.HasValue) return BadRequest(new { erro = "BlocoId obrigatório" });
        if (req.Escopo == EscopoAviso.Morador && !req.MoradorId.HasValue) return BadRequest(new { erro = "MoradorId obrigatório" });
        if (req.Escopo == EscopoAviso.Area && !req.AreaId.HasValue) return BadRequest(new { erro = "AreaId obrigatório" });

        var aviso = new Aviso
        {
            CondominioId = user.CondominioId!.Value,
            AutorId = user.UserId!.Value,
            QrToken = GerarToken(),
            Titulo = req.Titulo.Trim(),
            Texto = req.Texto,
            Template = req.Template,
            Tipo = req.Tipo,
            CategoriaId = req.CategoriaId,
            Escopo = req.Escopo,
            BlocoId = req.BlocoId,
            MoradorId = req.MoradorId,
            AreaId = req.AreaId,
            Urgente = req.Urgente,
            Fixado = req.Fixado,
            PublicarEm = req.PublicarEm,
            ValidoAte = req.ValidoAte,
            AnexoUrl = req.AnexoUrl,
            AnexoNome = req.AnexoNome,
            AnexoTamanho = req.AnexoTamanho,
            PublicadoEm = req.PublicarEm.HasValue && req.PublicarEm > DateTime.UtcNow ? null : DateTime.UtcNow
        };
        db.Avisos.Add(aviso);

        var ids = new List<Guid>();
        if (aviso.Escopo != EscopoAviso.Area)
        {
            var moradoresQuery = db.Moradores.Where(m => m.CondominioId == aviso.CondominioId && m.Status == StatusMorador.Ativo);
            if (aviso.Escopo == EscopoAviso.Bloco) moradoresQuery = moradoresQuery.Where(m => m.BlocoId == aviso.BlocoId);
            if (aviso.Escopo == EscopoAviso.Morador) moradoresQuery = moradoresQuery.Where(m => m.Id == aviso.MoradorId);
            ids = await moradoresQuery.Select(m => m.Id).ToListAsync();
            foreach (var mid in ids)
                db.AvisoRecibos.Add(new AvisoRecibo { AvisoId = aviso.Id, MoradorId = mid });
        }

        await db.SaveChangesAsync();
        return Ok(new { aviso.Id, aviso.QrToken, destinatarios = ids.Count });
    }

    [HttpGet]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Listar([FromQuery] bool incluirArquivados = false)
    {
        var q = db.Avisos.AsNoTracking().Where(a => a.CondominioId == user.CondominioId);
        if (!incluirArquivados) q = q.Where(a => a.ArquivadoEm == null);
        var lista = await q.OrderByDescending(a => a.Fixado).ThenByDescending(a => a.CriadoEm)
            .Select(a => new
            {
                a.Id, a.Titulo, Categoria = a.Categoria != null ? a.Categoria.Nome : null, a.Escopo, a.Urgente, a.Fixado,
                a.PublicarEm, a.PublicadoEm, a.ValidoAte, a.CriadoEm, a.ArquivadoEm,
                Lidos = db.AvisoRecibos.Count(r => r.AvisoId == a.Id && r.CienteEm != null),
                Total = db.AvisoRecibos.Count(r => r.AvisoId == a.Id)
            }).ToListAsync();
        return Ok(lista);
    }

    [HttpGet("{id:guid}/recibos")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Recibos(Guid id, [FromQuery] string? filtro)
    {
        var aviso = await db.Avisos.FirstOrDefaultAsync(a => a.Id == id && a.CondominioId == user.CondominioId);
        if (aviso is null) return NotFound();

        var q = db.AvisoRecibos.AsNoTracking().Include(r => r.Morador).ThenInclude(m => m.Bloco)
            .Where(r => r.AvisoId == id);
        q = filtro switch
        {
            "lidos" => q.Where(r => r.CienteEm != null),
            "naolidos" => q.Where(r => r.CienteEm == null),
            "responderam" => q.Where(r => r.RespondidoEm != null),
            _ => q
        };

        var lista = await q.OrderBy(r => r.Morador.Nome).Select(r => new
        {
            r.Id, r.MoradorId, Nome = r.Morador.Nome, r.Morador.Email, r.Morador.Telefone,
            r.Morador.Apartamento, Bloco = r.Morador.Bloco != null ? r.Morador.Bloco.Nome : null,
            r.CienteEm, r.Resposta, r.RespondidoEm,
            r.EmailEnviadoEm, r.EmailAbertoEm,
            r.VisualizadoEm, r.VisualizadoCidade, r.VisualizadoEstado, r.VisualizadoPais, r.VisualizadoUserAgent
        }).ToListAsync();

        var total = await db.AvisoRecibos.CountAsync(r => r.AvisoId == id);
        var lidos = await db.AvisoRecibos.CountAsync(r => r.AvisoId == id && r.CienteEm != null);
        return Ok(new { total, lidos, recibos = lista });
    }

    [HttpPost("{id:guid}/arquivar")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Arquivar(Guid id)
    {
        var a = await db.Avisos.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (a is null) return NotFound();
        a.ArquivadoEm = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("/api/publico/{condSlug}/area/{areaSlug}")]
    [AllowAnonymous]
    public async Task<IActionResult> FeedArea(string condSlug, string areaSlug)
    {
        var area = await db.Areas.AsNoTracking().Include(a => a.Condominio)
            .Where(a => a.Slug == areaSlug && a.Condominio.Slug == condSlug && !a.Condominio.Bloqueado)
            .Select(a => new { a.Id, a.Nome, Cond = new { a.Condominio.Nome, a.Condominio.LogoUrl, a.Condominio.CorPrimaria } })
            .FirstOrDefaultAsync();
        if (area is null) return NotFound();

        var avisos = await db.Avisos.AsNoTracking()
            .Where(a => a.AreaId == area.Id && a.ArquivadoEm == null
                && a.PublicadoEm != null && a.PublicadoEm <= DateTime.UtcNow
                && (a.ValidoAte == null || a.ValidoAte >= DateTime.UtcNow))
            .OrderByDescending(a => a.Fixado).ThenByDescending(a => a.PublicadoEm)
            .Select(a => new
            {
                a.Id, a.Titulo, a.Texto, a.Tipo, a.Template, a.Urgente, a.Fixado, a.PublicadoEm,
                a.AnexoUrl, a.AnexoNome
            }).ToListAsync();

        return Ok(new { area = new { area.Nome }, condominio = area.Cond, avisos });
    }

    [HttpGet("{id:guid}/morador")]
    [Authorize(Roles = "Morador")]
    public async Task<IActionResult> DetalheMorador(Guid id)
    {
        var moradorId = user.UserId!.Value;
        var r = await db.AvisoRecibos.Include(x => x.Aviso).ThenInclude(a => a.Condominio)
            .FirstOrDefaultAsync(x => x.AvisoId == id && x.MoradorId == moradorId);
        if (r is null) return NotFound();
        return Ok(new
        {
            r.Aviso.Id, r.Aviso.Titulo, r.Aviso.Texto, r.Aviso.Tipo, r.Aviso.Template,
            r.Aviso.Urgente, r.Aviso.Fixado, r.Aviso.PublicadoEm,
            r.Aviso.AnexoUrl, r.Aviso.AnexoNome,
            r.CienteEm, r.Resposta
        });
    }

    [HttpGet("morador/feed")]
    [Authorize(Roles = "Morador")]
    public async Task<IActionResult> FeedMorador()
    {
        var moradorId = user.UserId!.Value;
        var lista = await db.AvisoRecibos.AsNoTracking()
            .Where(r => r.MoradorId == moradorId && r.Aviso.ArquivadoEm == null
                && (r.Aviso.PublicadoEm != null && r.Aviso.PublicadoEm <= DateTime.UtcNow)
                && (r.Aviso.ValidoAte == null || r.Aviso.ValidoAte >= DateTime.UtcNow))
            .OrderByDescending(r => r.Aviso.Fixado).ThenByDescending(r => r.Aviso.PublicadoEm)
            .Select(r => new
            {
                r.AvisoId, r.Aviso.Titulo, r.Aviso.Texto, Categoria = r.Aviso.Categoria != null ? r.Aviso.Categoria.Nome : null, r.Aviso.Template,
                r.Aviso.Urgente, r.Aviso.Fixado, r.Aviso.PublicadoEm,
                r.Aviso.AnexoUrl, r.Aviso.AnexoNome,
                r.CienteEm, r.Resposta
            }).ToListAsync();
        return Ok(lista);
    }

    public record CienteReq(string? Resposta);
    [HttpPost("{id:guid}/ciente")]
    [Authorize(Roles = "Morador")]
    public async Task<IActionResult> MarcarCiente(Guid id, CienteReq req)
    {
        var moradorId = user.UserId!.Value;
        var r = await db.AvisoRecibos.FirstOrDefaultAsync(x => x.AvisoId == id && x.MoradorId == moradorId);
        if (r is null) return NotFound();
        r.CienteEm ??= DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(req.Resposta))
        {
            r.Resposta = req.Resposta.Trim();
            r.RespondidoEm = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();
        return NoContent();
    }

    static string GerarToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(8);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=')[..10];
    }
}
