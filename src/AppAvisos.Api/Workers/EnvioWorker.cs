using AppAvisos.Api.Services;
using AppAvisos.Domain.Entities;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Workers;

public class EnvioWorker(IServiceProvider sp, IConfiguration cfg, ILogger<EnvioWorker> log) : BackgroundService
{
    readonly TimeSpan _intervalo = TimeSpan.FromSeconds(15);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try { await ProcessarLote(ct); }
            catch (Exception ex) { log.LogError(ex, "Erro no worker de envio"); }
            await Task.Delay(_intervalo, ct);
        }
    }

    async Task ProcessarLote(CancellationToken ct)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailSender>();
        var push = scope.ServiceProvider.GetRequiredService<PushService>();
        var appUrl = cfg["AppUrl"] ?? "https://app.appavisos.com.br";

        var avisosPendentes = await db.Avisos.Include(a => a.Condominio)
            .Where(a => a.PublicadoEm == null && a.PublicarEm != null && a.PublicarEm <= DateTime.UtcNow)
            .Take(20).ToListAsync(ct);
        foreach (var a in avisosPendentes) a.PublicadoEm = DateTime.UtcNow;
        if (avisosPendentes.Count > 0) await db.SaveChangesAsync(ct);

        var lote = await db.AvisoRecibos.Include(r => r.Aviso).ThenInclude(a => a.Condominio).Include(r => r.Morador)
            .Where(r => (r.EmailEnviadoEm == null || r.PushEnviadoEm == null)
                && r.Aviso.PublicadoEm != null && r.Aviso.ArquivadoEm == null
                && !r.Morador.EmailInvalido)
            .Take(50).ToListAsync(ct);

        foreach (var r in lote)
        {
            if (r.EmailEnviadoEm == null && !string.IsNullOrEmpty(r.Morador.Email))
            {
                try
                {
                    var (assunto, html) = EmailTemplates.Renderizar(r.Aviso, r.Aviso.Condominio,
                        appUrl,
                        $"{appUrl}/c/{r.Aviso.Condominio.Slug}/aviso/{r.Aviso.Id}?ciente=1",
                        $"{appUrl}/c/{r.Aviso.Condominio.Slug}/aviso/{r.Aviso.Id}?responder=1",
                        $"{appUrl}/ativar-notificacoes",
                        $"{appUrl}/descadastrar?m={r.MoradorId}",
                        r.Id);
                    await email.EnviarAsync(r.Morador.Email, assunto, html, ct);
                    r.EmailEnviadoEm = DateTime.UtcNow;
                }
                catch (Exception ex) { log.LogWarning(ex, "Falha e-mail recibo {Id}", r.Id); }
            }
            if (r.PushEnviadoEm == null)
            {
                try
                {
                    await push.EnviarAsync(r.MoradorId, r.Aviso.Titulo,
                        r.Aviso.Texto.Length > 100 ? r.Aviso.Texto[..100] + "…" : r.Aviso.Texto,
                        $"{appUrl}/c/{r.Aviso.Condominio.Slug}/aviso/{r.Aviso.Id}",
                        r.AvisoId, ct);
                    r.PushEnviadoEm = DateTime.UtcNow;
                }
                catch (Exception ex) { log.LogWarning(ex, "Falha push recibo {Id}", r.Id); }
            }
        }
        if (lote.Count > 0) await db.SaveChangesAsync(ct);
    }
}
