using System.Text.RegularExpressions;
using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/cadastro")]
public class CadastroController(AppDbContext db, JwtService jwt) : ControllerBase
{
    public record CadastroCondominioReq(
        string NomeCondominio,
        string NomeSindico,
        string Email,
        string Telefone,
        string Senha,
        string? Cnpj);

    public record CadastroResp(string Token, Guid CondominioId, string Slug);

    [HttpPost("condominio")]
    public async Task<IActionResult> CadastrarCondominio(CadastroCondominioReq req)
    {
        if (string.IsNullOrWhiteSpace(req.NomeCondominio) || string.IsNullOrWhiteSpace(req.NomeSindico))
            return BadRequest(new { erro = "Nome do condomínio e do síndico são obrigatórios" });
        if (!Regex.IsMatch(req.Email ?? "", @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            return BadRequest(new { erro = "E-mail inválido" });
        if (!Regex.IsMatch(req.Senha ?? "", @"^\d{6}$"))
            return BadRequest(new { erro = "A senha deve ter 6 dígitos numéricos" });

        if (await db.Usuarios.AnyAsync(u => u.Email == req.Email))
            return Conflict(new { erro = "Já existe uma conta com esse e-mail" });

        var slug = await GerarSlugUnico(req.NomeCondominio);

        var cnpjLimpo = new string((req.Cnpj ?? "").Where(char.IsDigit).ToArray());
        var cond = new Condominio
        {
            Nome = req.NomeCondominio.Trim(),
            Slug = slug,
            TelefoneContato = req.Telefone?.Trim(),
            Cnpj = cnpjLimpo.Length == 14 ? cnpjLimpo : null
        };
        var sindico = new Usuario
        {
            CondominioId = cond.Id,
            Nome = req.NomeSindico.Trim(),
            Email = req.Email!.Trim().ToLowerInvariant(),
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(req.Senha),
            Perfil = PerfilUsuario.Sindico
        };

        db.Condominios.Add(cond);
        db.Usuarios.Add(sindico);
        SeedCategorias(db, cond.Id);
        await db.SaveChangesAsync();

        var token = jwt.Gerar(sindico.Id, cond.Id, sindico.Email, "Sindico");
        return Ok(new CadastroResp(token, cond.Id, slug));
    }

    async Task<string> GerarSlugUnico(string nome)
    {
        var basePart = Slugify(nome);
        var slug = basePart;
        var i = 2;
        while (await db.Condominios.AnyAsync(c => c.Slug == slug))
            slug = $"{basePart}-{i++}";
        return slug;
    }

    public static void SeedCategorias(AppDbContext db, Guid condominioId)
    {
        var defaults = new[] { "Geral", "Manutenção", "Urgente", "Achados", "Reservas" };
        for (int i = 0; i < defaults.Length; i++)
            db.Categorias.Add(new CategoriaAviso { CondominioId = condominioId, Nome = defaults[i], Ordem = i + 1 });
    }

    public static string Slugify(string s)
    {
        var n = s.Trim().ToLowerInvariant();
        n = Regex.Replace(n, @"[áàâãä]", "a");
        n = Regex.Replace(n, @"[éèêë]", "e");
        n = Regex.Replace(n, @"[íìîï]", "i");
        n = Regex.Replace(n, @"[óòôõö]", "o");
        n = Regex.Replace(n, @"[úùûü]", "u");
        n = Regex.Replace(n, @"ç", "c");
        n = Regex.Replace(n, @"[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(n) ? "condominio" : n[..Math.Min(60, n.Length)];
    }
}
