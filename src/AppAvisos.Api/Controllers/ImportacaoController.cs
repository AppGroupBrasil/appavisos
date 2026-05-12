using System.Text.RegularExpressions;
using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/importacao")]
[Authorize(Roles = "Sindico,Subsindico")]
public class ImportacaoController(AppDbContext db, CurrentUser user) : ControllerBase
{
    public record LinhaPreview(int Linha, string? Nome, string? Email, string? Telefone, string? Bloco, string? Apto, string? Erro);

    [HttpPost("moradores/preview")]
    public async Task<IActionResult> Preview(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { erro = "Arquivo vazio" });
        var blocos = await db.Blocos.Where(b => b.CondominioId == user.CondominioId)
            .ToDictionaryAsync(b => b.Nome.ToLowerInvariant(), b => b.Id);
        var emails = (await db.Moradores.Where(m => m.CondominioId == user.CondominioId)
            .Select(m => m.Email).ToListAsync()).ToHashSet();

        var linhas = new List<LinhaPreview>();
        await using var stream = file.OpenReadStream();
        using var wb = new XLWorkbook(stream);
        var ws = wb.Worksheet(1);
        var i = 0;
        foreach (var row in ws.RowsUsed().Skip(1))
        {
            i++;
            var nome = row.Cell(1).GetString().Trim();
            var email = row.Cell(2).GetString().Trim().ToLowerInvariant();
            var tel = row.Cell(3).GetString().Trim();
            var bloco = row.Cell(4).GetString().Trim();
            var apto = row.Cell(5).GetString().Trim();
            string? erro = null;
            if (string.IsNullOrWhiteSpace(nome)) erro = "Nome vazio";
            else if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$")) erro = "E-mail inválido";
            else if (emails.Contains(email)) erro = "E-mail já cadastrado";
            else if (!string.IsNullOrEmpty(bloco) && !blocos.ContainsKey(bloco.ToLowerInvariant())) erro = "Bloco inexistente";
            linhas.Add(new LinhaPreview(i, nome, email, tel, bloco, apto, erro));
        }
        return Ok(new { total = linhas.Count, validos = linhas.Count(l => l.Erro is null), linhas });
    }

    public record ConfirmarReq(List<LinhaPreview> Linhas);

    [HttpPost("moradores/confirmar")]
    public async Task<IActionResult> Confirmar(ConfirmarReq req)
    {
        var blocos = await db.Blocos.Where(b => b.CondominioId == user.CondominioId)
            .ToDictionaryAsync(b => b.Nome.ToLowerInvariant(), b => b.Id);

        var inseridos = 0;
        foreach (var l in req.Linhas.Where(l => l.Erro is null))
        {
            db.Moradores.Add(new Morador
            {
                CondominioId = user.CondominioId!.Value,
                Nome = l.Nome!.Trim(),
                Email = l.Email!.ToLowerInvariant(),
                Telefone = l.Telefone,
                Apartamento = l.Apto,
                BlocoId = !string.IsNullOrEmpty(l.Bloco) && blocos.TryGetValue(l.Bloco.ToLowerInvariant(), out var bid) ? bid : null,
                Status = StatusMorador.Ativo,
                AprovadoEm = DateTime.UtcNow
            });
            inseridos++;
        }
        await db.SaveChangesAsync();
        return Ok(new { inseridos });
    }

    [HttpGet("moradores/modelo.xlsx")]
    public IActionResult Modelo()
    {
        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Moradores");
        ws.Cell(1, 1).Value = "Nome"; ws.Cell(1, 2).Value = "Email";
        ws.Cell(1, 3).Value = "Telefone"; ws.Cell(1, 4).Value = "Bloco"; ws.Cell(1, 5).Value = "Apartamento";
        ws.Row(1).Style.Font.Bold = true;
        ws.Cell(2, 1).Value = "Maria Silva"; ws.Cell(2, 2).Value = "maria@email.com";
        ws.Cell(2, 3).Value = "11999999999"; ws.Cell(2, 4).Value = "A"; ws.Cell(2, 5).Value = "101";
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "modelo-moradores.xlsx");
    }
}
