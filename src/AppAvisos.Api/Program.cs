using System.Text;
using System.Threading.RateLimiting;
using AppAvisos.Api.Auth;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var logsDir = Path.Combine(AppContext.BaseDirectory, "logs");
try { Directory.CreateDirectory(logsDir); } catch { logsDir = Path.GetTempPath(); }
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(Path.Combine(logsDir, "app-.log"),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14,
        fileSizeLimitBytes: 50_000_000,
        rollOnFileSizeLimit: true,
        shared: true)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Configuração Jwt:Key obrigatória (mínimo 32 caracteres).");

builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    o.ForwardLimit = 2;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
    o.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(System.Net.IPAddress.Parse("0.0.0.0"), 0));
    o.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(System.Net.IPAddress.IPv6Any, 0));
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("postgres", tags: new[] { "ready" });

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    static string ClientIp(HttpContext ctx)
    {
        var cf = ctx.Request.Headers["CF-Connecting-IP"].ToString();
        if (!string.IsNullOrEmpty(cf)) return cf.Trim();
        var xff = ctx.Request.Headers["X-Forwarded-For"].ToString();
        if (!string.IsNullOrEmpty(xff)) return xff.Split(',')[0].Trim();
        return ctx.Connection.RemoteIpAddress?.ToString() ?? "anon";
    }
    o.AddPolicy("auth", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(ClientIp(ctx),
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddSingleton<JwtService>();
builder.Services.AddScoped<CurrentUser>();
builder.Services.AddScoped<AppAvisos.Api.Services.PushService>();
builder.Services.AddSingleton<AppAvisos.Api.Services.ActiveEmailProvider>();

var temCredenciais = !string.IsNullOrEmpty(builder.Configuration["Email:Resend:SmtpPass"])
    || !string.IsNullOrEmpty(builder.Configuration["Email:ElasticEmail:SmtpPass"]);

if (temCredenciais)
    builder.Services.AddSingleton<AppAvisos.Api.Services.IEmailSender, AppAvisos.Api.Services.SmtpEmailSender>();
else
    builder.Services.AddSingleton<AppAvisos.Api.Services.IEmailSender, AppAvisos.Api.Services.ConsoleEmailSender>();

builder.Services.AddHostedService<AppAvisos.Api.Workers.EnvioWorker>();

// Aceita JWT local + JWT do auth-central (mesma chave HS256, issuers/audiences distintos)
var validIssuers = new List<string> { builder.Configuration["Jwt:Issuer"] ?? "" };
var centralIssuer = builder.Configuration["AuthCentral:Issuer"] ?? "auth.appgroupebrasil.com.br";
if (!string.IsNullOrWhiteSpace(centralIssuer)) validIssuers.Add(centralIssuer);

var validAudiences = new List<string> { builder.Configuration["Jwt:Audience"] ?? "" };
const string AppSlug = "app-avisos";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuers = validIssuers,
            ValidAudiences = validAudiences,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        o.Events = new JwtBearerEvents
        {
            OnTokenValidated = ctx =>
            {
                var issuer = ctx.Principal?.FindFirst("iss")?.Value;
                if (issuer == centralIssuer)
                {
                    // Token do auth-central — array apps[] vira N claims "apps", cada uma JSON
                    var appClaims = ctx.Principal?.FindAll("apps") ?? Enumerable.Empty<System.Security.Claims.Claim>();
                    var ok = false;
                    foreach (var c in appClaims)
                    {
                        try
                        {
                            using var doc = System.Text.Json.JsonDocument.Parse(c.Value);
                            var root = doc.RootElement;
                            if (root.TryGetProperty("slug", out var slugEl) && slugEl.GetString() == AppSlug)
                            {
                                var st = root.TryGetProperty("status", out var stEl) ? stEl.GetString() : null;
                                if (st == "ativa" || st == "trial") ok = true;
                                break;
                            }
                        }
                        catch { /* ignora claim mal formada */ }
                    }
                    if (!ok) ctx.Fail("Sem licença ativa para App Avisos");
                }
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(
        "http://localhost:5173",
        "https://app.appavisos.com.br",
        "https://appavisos.com.br",
        "https://www.appavisos.com.br")
     .AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var uploadsDir = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsDir);
app.UseStaticFiles(new Microsoft.AspNetCore.Builder.StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads"
});

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseSerilogRequestLogging();
app.MapControllers();
app.MapHealthChecks("/health", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = r => r.Tags.Contains("ready") });

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppAvisos.Infrastructure.Persistence.AppDbContext>();
    await db.Database.MigrateAsync();

    var cfg = await db.ConfiguracoesSistema.FindAsync("email_provedor");
    if (cfg is not null)
        app.Services.GetRequiredService<AppAvisos.Api.Services.ActiveEmailProvider>().Current = cfg.Valor;
}
await AppAvisos.Api.MasterSeeder.SeedAsync(app.Services);

app.Run();
