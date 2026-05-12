using AppAvisos.Api.Auth;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/condominio")]
[Authorize]
public class CondominioController(AppDbContext db, CurrentUser user) : ControllerBase
{
    [HttpGet("identidade")]
    public async Task<IActionResult> Identidade()
    {
        var c = await db.Condominios.AsNoTracking()
            .Where(c => c.Id == user.CondominioId).Select(c => new
            {
                c.Id, c.Nome, c.Slug, c.DescricaoCurta, c.Endereco, c.Cnpj,
                c.TelefoneContato, c.EmailContato, c.Site, c.LogoUrl, c.CorPrimaria
            }).FirstOrDefaultAsync();
        if (c is null) return NotFound();
        return Ok(c);
    }

    public record IdentidadeReq(string? Nome, string? DescricaoCurta, string? Endereco, string? Cnpj,
        string? TelefoneContato, string? EmailContato, string? Site, string? CorPrimaria);

    [HttpPut("identidade")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> Atualizar(IdentidadeReq req)
    {
        var c = await db.Condominios.FindAsync(user.CondominioId);
        if (c is null) return NotFound();
        if (req.Nome is { } n) c.Nome = n.Trim();
        c.DescricaoCurta = req.DescricaoCurta ?? c.DescricaoCurta;
        c.Endereco = req.Endereco ?? c.Endereco;
        if (req.Cnpj is not null)
            c.Cnpj = new string(req.Cnpj.Where(char.IsDigit).ToArray());
        c.TelefoneContato = req.TelefoneContato ?? c.TelefoneContato;
        c.EmailContato = req.EmailContato ?? c.EmailContato;
        c.Site = req.Site ?? c.Site;
        c.CorPrimaria = req.CorPrimaria ?? c.CorPrimaria;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
