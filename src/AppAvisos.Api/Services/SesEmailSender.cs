using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace AppAvisos.Api.Services;

public class SmtpEmailSender(IConfiguration cfg, ActiveEmailProvider activeProvider) : IEmailSender
{
    readonly string _from = cfg["Email:From"] ?? "noreply@appavisos.com.br";

    public async Task EnviarAsync(string para, string assunto, string html, CancellationToken ct = default)
    {
        var section = activeProvider.Current == "elasticemail"
            ? cfg.GetSection("Email:ElasticEmail")
            : cfg.GetSection("Email:Resend");

        var host = section["SmtpHost"] ?? "smtp.resend.com";
        var port = int.TryParse(section["SmtpPort"], out var p) ? p : 587;
        var user = section["SmtpUser"] ?? "";
        var pass = section["SmtpPass"] ?? "";

        var msg = new MimeMessage();
        msg.From.Add(MailboxAddress.Parse(_from));
        msg.To.Add(MailboxAddress.Parse(para));
        msg.Subject = assunto;
        msg.Body = new TextPart("html") { Text = html };

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls, ct);
        await client.AuthenticateAsync(user, pass, ct);
        await client.SendAsync(msg, ct);
        await client.DisconnectAsync(true, ct);
    }
}

public class ConsoleEmailSender(ILogger<ConsoleEmailSender> log) : IEmailSender
{
    public Task EnviarAsync(string para, string assunto, string html, CancellationToken ct = default)
    {
        log.LogInformation("[EMAIL DEV] Para={Para} Assunto={Assunto}", para, assunto);
        return Task.CompletedTask;
    }
}
