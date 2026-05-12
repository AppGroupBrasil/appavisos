using System.Security.Claims;

namespace AppAvisos.Api.Auth;

public class CurrentUser(IHttpContextAccessor http)
{
    public Guid? UserId => GetGuid(ClaimTypes.NameIdentifier);
    public Guid? CondominioId => GetGuid("cond");
    public string? Email => http.HttpContext?.User.FindFirstValue(ClaimTypes.Email);
    public string? Perfil => http.HttpContext?.User.FindFirstValue(ClaimTypes.Role);

    Guid? GetGuid(string claim)
    {
        var v = http.HttpContext?.User.FindFirstValue(claim);
        return Guid.TryParse(v, out var g) ? g : null;
    }
}
