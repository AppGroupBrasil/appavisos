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

        const int maxTentativas = 5;
        var agora = DateTime.UtcNow;
        var lote = await db.AvisoRecibos.Include(r => r.Aviso).ThenInclude(a => a.Condominio).Include(r => r.Morador)
            .Where(r => (
                    (r.EmailEnviadoEm == null && r.EmailTentativas < maxTentativas
                        && (r.EmailProximaTentativaEm == null || r.EmailProximaTentativaEm <= agora)
                        && r.Morador.NotificacoesEmail && !r.Morador.EmailInvalido)
                 || (r.PushEnviadoEm == null && r.PushTentativas < maxTentativas
                        && (r.PushProximaTentativaEm == null || r.PushProximaTentativaEm <= agora)))
                && r.Aviso.PublicadoEm != null && r.Aviso.ArquivadoEm == null)
            .Take(50).ToListAsync(ct);

        foreach (var r in lote)
        {
            if (r.EmailEnviadoEm == null && r.EmailTentativas < maxTentativas
                && (r.EmailProximaTentativaEm == null || r.EmailProximaTentativaEm <= agora)
                && !string.IsNullOrEmpty(r.Morador.Email)
                && r.Morador.NotificacoesEmail && !r.Morador.EmailInvalido)
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
                    r.EmailProximaTentativaEm = null;
                }
                catch (Exception ex)
                {
                    r.EmailTentativas++;
                    r.EmailProximaTentativaEm = DateTime.UtcNow.AddMinutes(Math.Pow(2, r.EmailTentativas));
                    log.LogWarning(ex, "Falha e-mail recibo {Id} tentativa {N}", r.Id, r.EmailTentativas);
                }
            }
            if (r.PushEnviadoEm == null && r.PushTentativas < maxTentativas
                && (r.PushProximaTentativaEm == null || r.PushProximaTentativaEm <= agora))
            {
                try
                {
                    await push.EnviarAsync(r.MoradorId, r.Aviso.Titulo,
                        r.Aviso.Texto.Length > 100 ? r.Aviso.Texto[..100] + "…" : r.Aviso.Texto,
                        $"{appUrl}/c/{r.Aviso.Condominio.Slug}/aviso/{r.Aviso.Id}",
                        r.AvisoId, ct);
                    r.PushEnviadoEm = DateTime.UtcNow;
                    r.PushProximaTentativaEm = null;
                }
                catch (Exception ex)
                {
                    r.PushTentativas++;
                    r.PushProximaTentativaEm = DateTime.UtcNow.AddMinutes(Math.Pow(2, r.PushTentativas));
                    log.LogWarning(ex, "Falha push recibo {Id} tentativa {N}", r.Id, r.PushTentativas);
                }
            }
        }
        if (lote.Count > 0) await db.SaveChangesAsync(ct);
    }
}
