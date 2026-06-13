using System.IdentityModel.Tokens.Jwt;
using AppAvisos.Api.Auth;
using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AppAvisos.Api.Controllers;

// ─────────────────────────────────────────────────────────────────────────────
// SSO da central (App Condomínio) — login único.
// A central assina o token com a chave PRIVADA (RS256); aqui validamos só pela
// chave PÚBLICA do JWKS — nada a vazar. O cadastro da central é a fonte única da
// verdade: a cada acesso regravamos (read-only) o usuário. Fluxo: o hub redireciona
// para o front ${site}/sso?token=<JWT> → a SPA faz POST /api/sso { token } aqui →
// valida RS256/JWKS → JIT upsert → devolve a MESMA resposta do login local
// (token HS256 próprio + perfil/nome/condominioId). O Id local do usuário É o sub.
// ─────────────────────────────────────────────────────────────────────────────
[ApiController]
[Route("api/sso")]
[AllowAnonymous]
public class SsoController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;
    private readonly IConfiguration _config;

    public SsoController(AppDbContext db, JwtService jwt, IConfiguration config)
    {
        _db = db;
        _jwt = jwt;
        _config = config;
    }

    public record SsoReq(string token);
    public record LoginResp(string Token, string Perfil, string Nome, Guid CondominioId);

    private const string Iss = "auth-central";
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(8) };
    private static IList<SecurityKey>? _jwksCache;
    private static DateTime _jwksAt;
    private static readonly TimeSpan JwksTtl = TimeSpan.FromMinutes(5);

    private string Audience => _config["Sso:Audience"]
        ?? Environment.GetEnvironmentVariable("SSO_AUDIENCE") ?? "app-avisos";
    private string JwksUrl => _config["Sso:JwksUrl"]
        ?? Environment.GetEnvironmentVariable("SSO_JWKS_URL")
        ?? "https://auth.appgroupbrasil.com.br/api/v1/sso/jwks.json";

    private async Task<IList<SecurityKey>> CarregarJwksAsync()
    {
        if (_jwksCache != null && DateTime.UtcNow - _jwksAt < JwksTtl) return _jwksCache;
        var json = await Http.GetStringAsync(JwksUrl);
        var keys = new JsonWebKeySet(json).GetSigningKeys();
        _jwksCache = keys;
        _jwksAt = DateTime.UtcNow;
        return keys;
    }

    [HttpPost]
    public async Task<IActionResult> Trocar([FromBody] SsoReq req)
    {
        if (string.IsNullOrWhiteSpace(req?.token))
            return BadRequest(new { error = "Token ausente" });

        JwtSecurityToken jwt;
        try
        {
            var keys = await CarregarJwksAsync();
            var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
            handler.ValidateToken(req.token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = Iss,
                ValidateAudience = true,
                ValidAudience = Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = keys,
                ValidAlgorithms = new[] { "RS256" },
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
            }, out var validated);
            jwt = (JwtSecurityToken)validated;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SSO] falha: {ex.Message}");
            return Unauthorized(new { error = "SSO inválido" });
        }

        string? Claim(string n) => jwt.Claims.FirstOrDefault(c => c.Type == n)?.Value;
        var sub = Claim("sub");
        if (!Guid.TryParse(sub, out var uid))
            return Unauthorized(new { error = "sub inválido" });

        var email = (Claim("email") ?? "").Trim().ToLowerInvariant();
        var nome = Claim("nome") ?? email;
        var perfil = MapPerfil(Claim("perfil"));

        // Condomínio: upsert por Id = condominio_id da central (satisfaz a FK)
        Guid? condId = null;
        if (Guid.TryParse(Claim("condominio_id"), out var cid))
        {
            condId = cid;
            var cond = await _db.Condominios.FirstOrDefaultAsync(c => c.Id == cid);
            var condNome = Claim("condominio_nome") ?? "Condomínio";
            if (cond == null)
            {
                _db.Condominios.Add(new Condominio
                {
                    Id = cid,
                    Nome = condNome,
                    Slug = "cond-" + cid.ToString("N")[..8],
                });
            }
            else
            {
                cond.Nome = condNome;
            }
        }

        // Usuário: achar por Id=sub → senão por email → upsert (Id local É o sub)
        var u = await _db.Usuarios.FirstOrDefaultAsync(x => x.Id == uid);
        if (u == null && !string.IsNullOrEmpty(email))
            u = await _db.Usuarios.FirstOrDefaultAsync(x => x.Email == email);

        if (u == null)
        {
            u = new Usuario { Id = uid, SenhaHash = "!sso!" };
            _db.Usuarios.Add(u);
        }
        u.Email = email;
        u.Nome = nome;
        u.Perfil = perfil;
        if (condId.HasValue) u.CondominioId = condId;
        u.UltimoLogin = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var appToken = _jwt.Gerar(u.Id, u.CondominioId, u.Email, u.Perfil.ToString());
        return Ok(new LoginResp(appToken, u.Perfil.ToString(), u.Nome, u.CondominioId ?? Guid.Empty));
    }

    private static PerfilUsuario MapPerfil(string? role)
    {
        var r = (role ?? "").ToLowerInvariant();
        return r switch
        {
            "master" or "superadmin" => PerfilUsuario.Master,
            "admin" or "administrador" or "administradora" or "sindico" or "síndico" or "gestor" => PerfilUsuario.Sindico,
            "subsindico" or "supervisor" => PerfilUsuario.Subsindico,
            _ => PerfilUsuario.Morador,
        };
    }
}
