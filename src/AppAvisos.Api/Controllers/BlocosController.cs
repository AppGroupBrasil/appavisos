using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/blocos")]
[Authorize(Roles = "Sindico,Subsindico")]
public class BlocosController(AppDbContext db, CurrentUser user) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var lista = await db.Blocos.AsNoTracking()
            .Where(b => b.CondominioId == user.CondominioId)
            .OrderBy(b => b.Ordem).ThenBy(b => b.Nome)
            .Select(b => new { b.Id, b.Nome, b.Ordem }).ToListAsync();
        return Ok(lista);
    }

    public record CriarReq(string Nome);
    [HttpPost]
    public async Task<IActionResult> Criar(CriarReq req)
    {
        var ordem = (await db.Blocos.Where(b => b.CondominioId == user.CondominioId).MaxAsync(b => (int?)b.Ordem)) ?? 0;
        var b = new Bloco { CondominioId = user.CondominioId!.Value, Nome = req.Nome.Trim(), Ordem = ordem + 1 };
        db.Blocos.Add(b);
        await db.SaveChangesAsync();
        return Ok(new { b.Id, b.Nome, b.Ordem });
    }

    public record GerarReq(string Tipo, int? Quantidade, string? Prefixo);
    [HttpPost("gerar")]
    public async Task<IActionResult> Gerar(GerarReq req)
    {
        var existentes = await db.Blocos.Where(b => b.CondominioId == user.CondominioId).Select(b => b.Nome).ToListAsync();
        var ordem = (await db.Blocos.Where(b => b.CondominioId == user.CondominioId).MaxAsync(b => (int?)b.Ordem)) ?? 0;
        var novos = new List<Bloco>();

        IEnumerable<string> nomes = req.Tipo.ToLowerInvariant() switch
        {
            "numero" => Enumerable.Range(1, req.Quantidade ?? 0).Select(n => n.ToString()),
            "letra" => Enumerable.Range(0, req.Quantidade ?? 0).Select(i => ((char)('A' + i)).ToString()),
            "prefixo" => Enumerable.Range(1, req.Quantidade ?? 0).Select(n => $"{req.Prefixo} {n}"),
            _ => Enumerable.Empty<string>()
        };

        foreach (var nome in nomes)
        {
            if (existentes.Contains(nome)) continue;
            ordem++;
            novos.Add(new Bloco { CondominioId = user.CondominioId!.Value, Nome = nome, Ordem = ordem });
        }
        db.Blocos.AddRange(novos);
        await db.SaveChangesAsync();
        return Ok(new { criados = novos.Count });
    }

    public record RenomearReq(string Nome);
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Renomear(Guid id, RenomearReq req)
    {
        var b = await db.Blocos.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (b is null) return NotFound();
        b.Nome = req.Nome.Trim();
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var b = await db.Blocos.FirstOrDefaultAsync(x => x.Id == id && x.CondominioId == user.CondominioId);
        if (b is null) return NotFound();
        if (await db.Moradores.AnyAsync(m => m.BlocoId == id))
            return BadRequest(new { erro = "Bloco possui moradores" });
        db.Blocos.Remove(b);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
