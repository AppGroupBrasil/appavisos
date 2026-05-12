using AppAvisos.Api.Auth;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController(AppDbContext db, JwtService jwt, AppAvisos.Api.Services.IEmailSender email, IConfiguration cfg) : ControllerBase
{
    public record LoginReq(string Email, string Senha);
    public record LoginResp(string Token, string Perfil, string Nome, Guid CondominioId);
    public record RecuperarReq(string Email);
    public record RedefinirReq(string Token, string Senha);

    [HttpPost("recuperar")]
    public async Task<IActionResult> Recuperar(RecuperarReq req)
    {
        var emailNorm = (req.Email ?? "").Trim().ToLowerInvariant();
        var appUrl = cfg["AppUrl"] ?? "https://app.appavisos.com.br";
        var u = await db.Usuarios.FirstOrDefaultAsync(x => x.Email == emailNorm);
        var m = u is null ? await db.Moradores.FirstOrDefaultAsync(x => x.Email == emailNorm) : null;
        if (u is null && m is null) return Ok();

        var token = Guid.NewGuid().ToString("N");
        var expira = DateTime.UtcNow.AddHours(2);
        string nome;
        if (u is not null) { u.TokenReset = token; u.TokenResetExpiraEm = expira; nome = u.Nome; }
        else { m!.TokenReset = token; m.TokenResetExpiraEm = expira; nome = m.Nome; }
        await db.SaveChangesAsync();

        var link = $"{appUrl}/redefinir/{token}";
        var html = $@"<div style='font-family:Inter,Arial,sans-serif;max-width:560px;margin:24px auto;padding:24px;color:#0F172A'>
<h2>Recuperação de senha — AppAvisos</h2>
<p>Olá, {System.Net.WebUtility.HtmlEncode(nome)}.</p>
<p>Use o botão abaixo para definir uma nova senha (link válido por 2 horas):</p>
<p><a href='{link}' style='display:inline-block;padding:12px 24px;background:#0F172A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600'>Redefinir senha</a></p>
<p style='color:#64748B;font-size:13px'>Se você não solicitou, ignore este e-mail.</p></div>";
        try { await email.EnviarAsync(emailNorm, "Recuperação de senha — AppAvisos", html); } catch { }
        return Ok();
    }

    [HttpPost("redefinir")]
    public async Task<IActionResult> Redefinir(RedefinirReq req)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(req.Senha ?? "", @"^\d{6}$"))
            return BadRequest(new { erro = "Senha deve ter 6 dígitos" });
        var agora = DateTime.UtcNow;
        var u = await db.Usuarios.FirstOrDefaultAsync(x => x.TokenReset == req.Token && x.TokenResetExpiraEm > agora);
        var m = u is null ? await db.Moradores.FirstOrDefaultAsync(x => x.TokenReset == req.Token && x.TokenResetExpiraEm > agora) : null;
        if (u is null && m is null) return BadRequest(new { erro = "Link inválido ou expirado" });
        var hash = BCrypt.Net.BCrypt.HashPassword(req.Senha);
        if (u is not null) { u.SenhaHash = hash; u.TokenReset = null; u.TokenResetExpiraEm = null; }
        else { m!.SenhaHash = hash; m.TokenReset = null; m.TokenResetExpiraEm = null; }
        await db.SaveChangesAsync();
        return NoContent();
    }


    [HttpPost("sindico/login")]
    public async Task<IActionResult> LoginSindico(LoginReq req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var u = await db.Usuarios.Include(x => x.Condominio).FirstOrDefaultAsync(x => x.Email == email);
        if (u is null || !BCrypt.Net.BCrypt.Verify(req.Senha, u.SenhaHash))
            return Unauthorized(new { erro = "E-mail ou senha inválidos" });

        if (u.Perfil != PerfilUsuario.Master && u.Condominio is { Bloqueado: true })
            return StatusCode(403, new { erro = "Acesso bloqueado. Contate o suporte." });

        u.UltimoLogin = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var token = jwt.Gerar(u.Id, u.CondominioId, u.Email, u.Perfil.ToString());
        return Ok(new LoginResp(token, u.Perfil.ToString(), u.Nome, u.CondominioId ?? Guid.Empty));
    }

    [HttpPost("morador/login")]
    public async Task<IActionResult> LoginMorador(LoginReq req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var m = await db.Moradores.Include(x => x.Condominio).FirstOrDefaultAsync(x => x.Email == email);
        if (m is null || m.SenhaHash is null || !BCrypt.Net.BCrypt.Verify(req.Senha, m.SenhaHash))
            return Unauthorized(new { erro = "E-mail ou senha inválidos" });
        if (m.Status != StatusMorador.Ativo)
            return Unauthorized(new { erro = "Cadastro pendente de aprovação" });
        if (m.Condominio.Bloqueado)
            return StatusCode(403, new { erro = "Acesso bloqueado. Contate o suporte." });

        var token = jwt.Gerar(m.Id, m.CondominioId, m.Email, "Morador");
        return Ok(new LoginResp(token, "Morador", m.Nome, m.CondominioId));
    }
}
