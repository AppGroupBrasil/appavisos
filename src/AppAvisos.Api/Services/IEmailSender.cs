namespace AppAvisos.Api.Services;

public interface IEmailSender
{
    Task EnviarAsync(string para, string assunto, string html, CancellationToken ct = default);
}
