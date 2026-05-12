using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/canais-reporte")]
[Authorize(Roles = "Sindico,Subsindico")]
public class CanaisReporteController(AppDbContext db, CurrentUser user) : ControllerBase
{
    public record CanalReq(string Nome, string? Descricao, Guid? AreaId, bool IdentificacaoObrigatoria, bool Ativo);

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var lista = await db.CanaisReporte.AsNoTracking().Include(c => c.Area)
            .Where(c => c.CondominioId == user.CondominioId)
            .OrderByDescending(c => c.Ativo).ThenByDescending(c => c.CriadoEm)
            .Select(c => new {
                c.Id, c.Nome, c.Descricao, c.IdentificacaoObrigatoria, c.Ativo, c.Token,
                area = c.Area != null ? c.Area.Nome : null, c.AreaId, c.CriadoEm
            }).ToListAsync();
        return Ok(lista);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(CanalReq req)
    {
        if (string.IsNullOrWhiteSpace(req.Nome)) return BadRequest(new { erro = "Nome é obrigatório" });
        if (req.AreaId.HasValue && !await db.Areas.AnyAsync(a => a.Id == req.AreaId && a.CondominioId == user.CondominioId))
            return BadRequest(new { erro = "Área inválida" });
        var c = new CanalReporte
        {
            CondominioId = user.CondominioId!.Value,
            AreaId = req.AreaId,
            Nome = req.Nome.Trim(),
            Descricao = req.Descricao?.Trim(),
            IdentificacaoObrigatoria = req.IdentificacaoObrigatoria,
            Ativo = req.Ativo
        };
        db.CanaisReporte.Add(c);
        await db.SaveChangesAsync();
        return Ok(new { c.Id, c.Token });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, CanalReq req)
    {
        var c = await db.CanaisReporte.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (c is null) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Nome)) return BadRequest(new { erro = "Nome é obrigatório" });
        if (req.AreaId.HasValue && !await db.Areas.AnyAsync(a => a.Id == req.AreaId && a.CondominioId == user.CondominioId))
            return BadRequest(new { erro = "Área inválida" });
        c.Nome = req.Nome.Trim();
        c.Descricao = req.Descricao?.Trim();
        c.AreaId = req.AreaId;
        c.IdentificacaoObrigatoria = req.IdentificacaoObrigatoria;
        c.Ativo = req.Ativo;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var c = await db.CanaisReporte.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (c is null) return NotFound();
        db.CanaisReporte.Remove(c);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
