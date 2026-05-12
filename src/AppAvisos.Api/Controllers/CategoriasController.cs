using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/categorias")]
[Authorize]
public class CategoriasController(AppDbContext db, CurrentUser user) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var lista = await db.Categorias.AsNoTracking()
            .Where(c => c.CondominioId == user.CondominioId)
            .OrderBy(c => c.Ordem).ThenBy(c => c.Nome)
            .Select(c => new { c.Id, c.Nome, c.Ordem }).ToListAsync();
        return Ok(lista);
    }

    public record CriarReq(string Nome);

    [HttpPost]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Criar(CriarReq req)
    {
        if (string.IsNullOrWhiteSpace(req.Nome)) return BadRequest(new { erro = "Nome obrigatório" });
        var nome = req.Nome.Trim();
        if (await db.Categorias.AnyAsync(c => c.CondominioId == user.CondominioId && c.Nome == nome))
            return Conflict(new { erro = "Categoria já existe" });
        var ordem = (await db.Categorias.Where(c => c.CondominioId == user.CondominioId).MaxAsync(c => (int?)c.Ordem)) ?? 0;
        var cat = new CategoriaAviso { CondominioId = user.CondominioId!.Value, Nome = nome, Ordem = ordem + 1 };
        db.Categorias.Add(cat);
        await db.SaveChangesAsync();
        return Ok(new { cat.Id, cat.Nome });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Renomear(Guid id, CriarReq req)
    {
        var c = await db.Categorias.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (c is null) return NotFound();
        c.Nome = req.Nome.Trim();
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var c = await db.Categorias.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (c is null) return NotFound();
        if (await db.Avisos.AnyAsync(a => a.CategoriaId == id))
            return BadRequest(new { erro = "Categoria em uso por avisos" });
        db.Categorias.Remove(c);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
