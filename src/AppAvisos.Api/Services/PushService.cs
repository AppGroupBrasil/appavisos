using System.Text.Json;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using WebPush;
using DbPushSub = AppAvisos.Domain.Entities.PushSubscription;

namespace AppAvisos.Api.Services;

public class PushService(IConfiguration cfg, AppDbContext db, ILogger<PushService> log)
{
    readonly VapidDetails _vapid = new(
        cfg["Vapid:Subject"] ?? "mailto:contato@appavisos.com.br",
        cfg["Vapid:PublicKey"] ?? "",
        cfg["Vapid:PrivateKey"] ?? "");

    public string ChavePublica => cfg["Vapid:PublicKey"] ?? "";

    public async Task EnviarAsync(Guid moradorId, string titulo, string corpo, string url, Guid avisoId, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_vapid.PublicKey) || string.IsNullOrEmpty(_vapid.PrivateKey))
        {
            log.LogWarning("VAPID não configurado, push ignorado");
            return;
        }
        var subs = await db.PushSubscriptions.Where(s => s.MoradorId == moradorId).ToListAsync(ct);
        var client = new WebPushClient();
        var payload = JsonSerializer.Serialize(new { titulo, corpo, url, avisoId });
        var invalidos = new List<DbPushSub>();
        foreach (var s in subs)
        {
            try
            {
                var ws = new PushSubscription(s.Endpoint, s.P256dh, s.Auth);
                await client.SendNotificationAsync(ws, payload, _vapid);
                s.UltimoUso = DateTime.UtcNow;
            }
            catch (WebPushException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Gone || ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                invalidos.Add(s);
            }
            catch (Exception ex)
            {
                log.LogWarning(ex, "Falha push morador {MoradorId}", moradorId);
            }
        }
        if (invalidos.Count > 0) db.PushSubscriptions.RemoveRange(invalidos);
        await db.SaveChangesAsync(ct);
    }
}
