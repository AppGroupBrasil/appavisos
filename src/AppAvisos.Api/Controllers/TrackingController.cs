using AppAvisos.Api.Auth;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
public class TrackingController(AppDbContext db, IHttpClientFactory http) : ControllerBase
{
    static readonly byte[] _gif = Convert.FromBase64String("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");

    [HttpGet("/api/email/aberto/{reciboId:guid}.gif")]
    public async Task<IActionResult> EmailAberto(Guid reciboId)
    {
        var r = await db.AvisoRecibos.FirstOrDefaultAsync(x => x.Id == reciboId);
        if (r is not null && r.EmailAbertoEm is null)
        {
            r.EmailAbertoEm = DateTime.UtcNow;
            r.EmailAbertoIp = ObterIp();
            r.EmailAbertoUserAgent = Request.Headers["User-Agent"].ToString();
            await db.SaveChangesAsync();
        }
        Response.Headers["Cache-Control"] = "no-store";
        return File(_gif, "image/gif");
    }

    [HttpPost("/api/avisos/{avisoId:guid}/visualizar")]
    public async Task<IActionResult> Visualizar(Guid avisoId, [FromServices] CurrentUser user)
    {
        if (user.Perfil != "Morador" || !user.UserId.HasValue) return NoContent();
        var r = await db.AvisoRecibos.FirstOrDefaultAsync(x => x.AvisoId == avisoId && x.MoradorId == user.UserId);
        if (r is null) return NotFound();
        if (r.VisualizadoEm is null)
        {
            r.VisualizadoEm = DateTime.UtcNow;
            r.VisualizadoIp = ObterIp();
            r.VisualizadoUserAgent = Request.Headers["User-Agent"].ToString();
            _ = GeolocalizarAsync(r);
            await db.SaveChangesAsync();
        }
        return NoContent();
    }

    string ObterIp()
    {
        var fwd = Request.Headers["CF-Connecting-IP"].ToString();
        if (!string.IsNullOrEmpty(fwd)) return fwd;
        fwd = Request.Headers["X-Forwarded-For"].ToString();
        if (!string.IsNullOrEmpty(fwd)) return fwd.Split(',')[0].Trim();
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
    }

    async Task GeolocalizarAsync(Domain.Entities.AvisoRecibo r)
    {
        try
        {
            if (string.IsNullOrEmpty(r.VisualizadoIp)) return;
            var c = http.CreateClient();
            c.Timeout = TimeSpan.FromSeconds(3);
            var json = await c.GetStringAsync($"http://ip-api.com/json/{r.VisualizadoIp}?fields=status,country,regionName,city");
            var d = System.Text.Json.JsonDocument.Parse(json).RootElement;
            if (d.GetProperty("status").GetString() == "success")
            {
                r.VisualizadoCidade = d.TryGetProperty("city", out var c1) ? c1.GetString() : null;
                r.VisualizadoEstado = d.TryGetProperty("regionName", out var s1) ? s1.GetString() : null;
                r.VisualizadoPais = d.TryGetProperty("country", out var p1) ? p1.GetString() : null;
            }
        }
        catch { /* silencioso */ }
    }
}
