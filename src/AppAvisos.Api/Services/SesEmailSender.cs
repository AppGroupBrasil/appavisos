using Amazon;
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;

namespace AppAvisos.Api.Services;

public class SesEmailSender : IEmailSender
{
    readonly AmazonSimpleEmailServiceV2Client _client;
    readonly string _from;

    public SesEmailSender(IConfiguration cfg)
    {
        var region = RegionEndpoint.GetBySystemName(cfg["Aws:Region"] ?? "us-east-1");
        var accessKey = cfg["Aws:AccessKey"];
        var secretKey = cfg["Aws:SecretKey"];
        _client = string.IsNullOrEmpty(accessKey)
            ? new AmazonSimpleEmailServiceV2Client(region)
            : new AmazonSimpleEmailServiceV2Client(accessKey, secretKey, region);
        _from = cfg["Email:From"] ?? "noreply@appavisos.com.br";
    }

    public async Task EnviarAsync(string para, string assunto, string html, CancellationToken ct = default)
    {
        await _client.SendEmailAsync(new SendEmailRequest
        {
            FromEmailAddress = _from,
            Destination = new Destination { ToAddresses = new List<string> { para } },
            Content = new EmailContent
            {
                Simple = new Message
                {
                    Subject = new Content { Data = assunto, Charset = "UTF-8" },
                    Body = new Body { Html = new Content { Data = html, Charset = "UTF-8" } }
                }
            }
        }, ct);
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
