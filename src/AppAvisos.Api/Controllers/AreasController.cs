using System.Text.RegularExpressions;
using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/areas")]
[Authorize]
public class AreasController(AppDbContext db, CurrentUser user) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var lista = await db.Areas.AsNoTracking()
            .Where(a => a.CondominioId == user.CondominioId)
            .OrderBy(a => a.Ordem).ThenBy(a => a.Nome)
            .Select(a => new { a.Id, a.Nome, a.Slug, a.Ordem }).ToListAsync();
        return Ok(lista);
    }

    public record CriarReq(string Nome);

    [HttpPost]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Criar(CriarReq req)
    {
        if (string.IsNullOrWhiteSpace(req.Nome)) return BadRequest(new { erro = "Nome obrigatório" });
        var nome = req.Nome.Trim();
        var slug = await GerarSlugUnico(nome);
        var ordem = (await db.Areas.Where(a => a.CondominioId == user.CondominioId).MaxAsync(a => (int?)a.Ordem)) ?? 0;
        var a = new Area { CondominioId = user.CondominioId!.Value, Nome = nome, Slug = slug, Ordem = ordem + 1 };
        db.Areas.Add(a);
        await db.SaveChangesAsync();
        return Ok(new { a.Id, a.Nome, a.Slug });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Renomear(Guid id, CriarReq req)
    {
        var a = await db.Areas.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (a is null) return NotFound();
        a.Nome = req.Nome.Trim();
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var a = await db.Areas.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (a is null) return NotFound();
        if (await db.Avisos.AnyAsync(av => av.AreaId == id))
            return BadRequest(new { erro = "Área tem avisos vinculados" });
        db.Areas.Remove(a);
        await db.SaveChangesAsync();
        return NoContent();
    }

    async Task<string> GerarSlugUnico(string nome)
    {
        var basePart = Slugify(nome);
        var slug = basePart;
        var i = 2;
        while (await db.Areas.AnyAsync(a => a.CondominioId == user.CondominioId && a.Slug == slug))
            slug = $"{basePart}-{i++}";
        return slug;
    }

    static string Slugify(string s)
    {
        var n = s.Trim().ToLowerInvariant();
        n = Regex.Replace(n, @"[áàâãä]", "a");
        n = Regex.Replace(n, @"[éèêë]", "e");
        n = Regex.Replace(n, @"[íìîï]", "i");
        n = Regex.Replace(n, @"[óòôõö]", "o");
        n = Regex.Replace(n, @"[úùûü]", "u");
        n = Regex.Replace(n, @"ç", "c");
        n = Regex.Replace(n, @"[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(n) ? "area" : n[..Math.Min(60, n.Length)];
    }
}
