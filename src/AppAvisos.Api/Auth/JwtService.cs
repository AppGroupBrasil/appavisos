using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace AppAvisos.Api.Auth;

public record JwtOptions(string Issuer, string Audience, string Key, int ExpiraMinutos, int RefreshDias);

public class JwtService(IConfiguration cfg)
{
    public JwtOptions Options { get; } = new(
        cfg["Jwt:Issuer"]!, cfg["Jwt:Audience"]!, cfg["Jwt:Key"]!,
        int.Parse(cfg["Jwt:ExpiraMinutos"] ?? "60"),
        int.Parse(cfg["Jwt:RefreshDias"] ?? "30"));

    public string Gerar(Guid userId, Guid? condominioId, string email, string perfil)
    {
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Options.Key)),
            SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, perfil)
        };
        if (condominioId.HasValue)
            claims.Add(new Claim("cond", condominioId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: Options.Issuer,
            audience: Options.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(Options.ExpiraMinutos),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
