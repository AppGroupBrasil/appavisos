using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/qr-personalizados")]
[Authorize(Roles = "Sindico,Subsindico")]
public class QrPersonalizadosController(AppDbContext db, CurrentUser user) : ControllerBase
{
    public record CriarReq(string Titulo, string Descricao, string Url);
    public record EditarReq(string Titulo, string Descricao);

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var lista = await db.QrPersonalizados.AsNoTracking()
            .Where(x => x.CondominioId == user.CondominioId)
            .OrderBy(x => x.Ordem).ThenBy(x => x.CriadoEm)
            .Select(x => new { x.Id, x.Titulo, x.Descricao, x.Url, x.Ordem })
            .ToListAsync();
        return Ok(lista);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(CriarReq req)
    {
        if (string.IsNullOrWhiteSpace(req.Titulo)) return BadRequest(new { erro = "Título obrigatório" });
        if (string.IsNullOrWhiteSpace(req.Url)) return BadRequest(new { erro = "URL obrigatória" });

        var maxOrdem = await db.QrPersonalizados
            .Where(x => x.CondominioId == user.CondominioId)
            .Select(x => (int?)x.Ordem).MaxAsync() ?? -1;

        var qr = new QrPersonalizado
        {
            CondominioId = user.CondominioId!.Value,
            Titulo = req.Titulo.Trim(),
            Descricao = req.Descricao?.Trim() ?? "",
            Url = req.Url.Trim(),
            Ordem = maxOrdem + 1
        };
        db.QrPersonalizados.Add(qr);
        await db.SaveChangesAsync();
        return Ok(new { qr.Id, qr.Titulo, qr.Descricao, qr.Url, qr.Ordem });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Editar(Guid id, EditarReq req)
    {
        var qr = await db.QrPersonalizados
            .FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (qr is null) return NotFound();
        qr.Titulo = req.Titulo.Trim();
        qr.Descricao = req.Descricao?.Trim() ?? "";
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var qr = await db.QrPersonalizados
            .FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (qr is null) return NotFound();
        db.QrPersonalizados.Remove(qr);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
