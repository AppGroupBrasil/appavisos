using AppAvisos.Api.Auth;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QRCoder;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/qr")]
public class QrController(AppDbContext db, CurrentUser user, IConfiguration cfg) : ControllerBase
{
    string BaseUrl => cfg["AppUrl"] ?? "https://app.appavisos.com.br";

    [HttpGet("feed.png")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> QrFeed([FromQuery] int tamanho = 12)
    {
        var slug = await db.Condominios.Where(c => c.Id == user.CondominioId).Select(c => c.Slug).FirstOrDefaultAsync();
        if (slug is null) return NotFound();
        return File(GerarPng($"{BaseUrl}/c/{slug}", tamanho), "image/png");
    }

    [HttpGet("cadastro.png")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> QrCadastro([FromQuery] int tamanho = 12)
    {
        var slug = await db.Condominios.Where(c => c.Id == user.CondominioId).Select(c => c.Slug).FirstOrDefaultAsync();
        if (slug is null) return NotFound();
        return File(GerarPng($"{BaseUrl}/cadastro/{slug}", tamanho), "image/png");
    }

    [HttpGet("area/{areaId:guid}.png")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> QrArea(Guid areaId, [FromQuery] int tamanho = 12)
    {
        var data = await db.Areas.AsNoTracking().Include(a => a.Condominio)
            .Where(a => a.Id == areaId && a.CondominioId == user.CondominioId)
            .Select(a => new { a.Slug, CondSlug = a.Condominio.Slug }).FirstOrDefaultAsync();
        if (data is null) return NotFound();
        return File(GerarPng($"{BaseUrl}/c/{data.CondSlug}/area/{data.Slug}", tamanho), "image/png");
    }

    [HttpGet("aviso/{id:guid}.png")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> QrAviso(Guid id, [FromQuery] int tamanho = 12)
    {
        var a = await db.Avisos.AsNoTracking().Where(x => x.Id == id && x.CondominioId == user.CondominioId)
            .Select(x => new { x.QrToken }).FirstOrDefaultAsync();
        if (a is null) return NotFound();
        return File(GerarPng($"{BaseUrl}/q/{a.QrToken}", tamanho), "image/png");
    }

    [HttpGet("reportar.png")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> QrReportar([FromQuery] int tamanho = 12)
    {
        var slug = await db.Condominios.Where(c => c.Id == user.CondominioId).Select(c => c.Slug).FirstOrDefaultAsync();
        if (slug is null) return NotFound();
        return File(GerarPng($"{BaseUrl}/c/{slug}/reportar", tamanho), "image/png");
    }

    [HttpGet("reportar/area/{areaId:guid}.png")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> QrReportarArea(Guid areaId, [FromQuery] int tamanho = 12)
    {
        var data = await db.Areas.AsNoTracking().Include(a => a.Condominio)
            .Where(a => a.Id == areaId && a.CondominioId == user.CondominioId)
            .Select(a => new { a.Id, CondSlug = a.Condominio.Slug }).FirstOrDefaultAsync();
        if (data is null) return NotFound();
        return File(GerarPng($"{BaseUrl}/c/{data.CondSlug}/reportar?area={data.Id}", tamanho), "image/png");
    }

    [HttpGet("canal/{id:guid}.png")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> QrCanal(Guid id, [FromQuery] int tamanho = 12)
    {
        var data = await db.CanaisReporte.AsNoTracking().Include(c => c.Condominio)
            .Where(c => c.Id == id && c.CondominioId == user.CondominioId)
            .Select(c => new { c.Token, CondSlug = c.Condominio.Slug }).FirstOrDefaultAsync();
        if (data is null) return NotFound();
        return File(GerarPng($"{BaseUrl}/c/{data.CondSlug}/reportar/{data.Token}", tamanho), "image/png");
    }

    [HttpGet("personalizado/{id:guid}.png")]
    [Authorize(Roles = "Sindico,Subsindico")]
    public async Task<IActionResult> QrPersonalizado(Guid id, [FromQuery] int tamanho = 12)
    {
        var url = await db.QrPersonalizados.AsNoTracking()
            .Where(x => x.Id == id && x.CondominioId == user.CondominioId)
            .Select(x => x.Url).FirstOrDefaultAsync();
        if (url is null) return NotFound();
        return File(GerarPng(url, tamanho), "image/png");
    }

    [HttpGet("/q/{token}")]
    public async Task<IActionResult> Resolver(string token)
    {
        var a = await db.Avisos.AsNoTracking().Include(x => x.Condominio)
            .Where(x => x.QrToken == token).Select(x => new { x.Id, x.Condominio.Slug }).FirstOrDefaultAsync();
        if (a is null) return NotFound();
        return Redirect($"{BaseUrl}/c/{a.Slug}/aviso/{a.Id}");
    }

    static byte[] GerarPng(string conteudo, int tamanho)
    {
        using var gen = new QRCodeGenerator();
        using var data = gen.CreateQrCode(conteudo, QRCodeGenerator.ECCLevel.M);
        using var qr = new PngByteQRCode(data);
        return qr.GetGraphic(tamanho);
    }
}
