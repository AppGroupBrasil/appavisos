using AppAvisos.Api.Auth;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api.Controllers;

[ApiController]
[Route("api/uploads")]
[Authorize(Roles = "Sindico,Subsindico")]
public class UploadsController(AppDbContext db, CurrentUser user, IWebHostEnvironment env) : ControllerBase
{
    static readonly string[] ImagensPermitidas = { ".jpg", ".jpeg", ".png", ".webp", ".svg" };
    static readonly string[] AnexosPermitidos = { ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx" };
    const long MaxAnexo = 5 * 1024 * 1024;
    const long MaxLogo = 2 * 1024 * 1024;

    [HttpPost("logo")]
    public async Task<IActionResult> EnviarLogo(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { erro = "Arquivo vazio" });
        if (file.Length > MaxLogo) return BadRequest(new { erro = "Logo até 2MB" });
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!ImagensPermitidas.Contains(ext)) return BadRequest(new { erro = "Formato inválido" });

        var url = await SalvarAsync(file, $"logos/{user.CondominioId}", ext);
        var c = await db.Condominios.FindAsync(user.CondominioId);
        if (c is not null) { c.LogoUrl = url; await db.SaveChangesAsync(); }
        return Ok(new { url });
    }

    [HttpPost("documento")]
    public async Task<IActionResult> EnviarDocumento(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { erro = "Arquivo vazio" });
        if (file.Length > 10 * 1024 * 1024) return BadRequest(new { erro = "Documento até 10MB" });
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AnexosPermitidos.Contains(ext)) return BadRequest(new { erro = "Formato não permitido" });
        var raiz = Path.Combine(env.ContentRootPath, "documentos", user.CondominioId!.Value.ToString());
        Directory.CreateDirectory(raiz);
        var nome = $"{Guid.NewGuid():N}{ext}";
        await using (var fs = System.IO.File.Create(Path.Combine(raiz, nome)))
            await file.CopyToAsync(fs);
        return Ok(new { url = $"documento:{nome}", nome = file.FileName, tamanho = file.Length });
    }

    [HttpPost("anexo")]
    public async Task<IActionResult> EnviarAnexo(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { erro = "Arquivo vazio" });
        if (file.Length > MaxAnexo) return BadRequest(new { erro = "Anexo até 5MB" });
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AnexosPermitidos.Contains(ext)) return BadRequest(new { erro = "Formato não permitido" });

        var url = await SalvarAsync(file, $"anexos/{user.CondominioId}", ext);
        return Ok(new { url, nome = file.FileName, tamanho = file.Length });
    }

    async Task<string> SalvarAsync(IFormFile file, string subdir, string ext)
    {
        var raiz = Path.Combine(env.ContentRootPath, "uploads", subdir);
        Directory.CreateDirectory(raiz);
        var nome = $"{Guid.NewGuid():N}{ext}";
        var caminho = Path.Combine(raiz, nome);
        await using var fs = System.IO.File.Create(caminho);
        await file.CopyToAsync(fs);
        return $"/uploads/{subdir}/{nome}";
    }
}
