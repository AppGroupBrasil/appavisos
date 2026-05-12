using AppAvisos.Api.Auth;
using AppAvisos.Api.Services;
using AppAvisos.Domain.Entities;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/push")]
public class PushController(AppDbContext db, CurrentUser user, PushService push) : ControllerBase
{
    [HttpGet("chave-publica")]
    public IActionResult ChavePublica() => Ok(new { chave = push.ChavePublica });

    public record AssinarReq(string Endpoint, string P256dh, string Auth);

    [HttpPost("assinar")]
    [Authorize(Roles = "Morador")]
    public async Task<IActionResult> Assinar(AssinarReq req)
    {
        var moradorId = user.UserId!.Value;
        var existente = await db.PushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == req.Endpoint);
        if (existente is null)
        {
            db.PushSubscriptions.Add(new PushSubscription
            {
                MoradorId = moradorId, Endpoint = req.Endpoint, P256dh = req.P256dh, Auth = req.Auth
            });
        }
        else
        {
            existente.MoradorId = moradorId;
            existente.P256dh = req.P256dh;
            existente.Auth = req.Auth;
        }
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("assinar")]
    [Authorize(Roles = "Morador")]
    public async Task<IActionResult> Remover([FromQuery] string endpoint)
    {
        var s = await db.PushSubscriptions.FirstOrDefaultAsync(x => x.Endpoint == endpoint);
        if (s is not null) { db.PushSubscriptions.Remove(s); await db.SaveChangesAsync(); }
        return NoContent();
    }
}
