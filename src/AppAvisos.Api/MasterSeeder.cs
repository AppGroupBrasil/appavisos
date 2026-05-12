using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;
using AppAvisos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Api;

public static class MasterSeeder
{
    public static async Task SeedAsync(IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cfg = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var email = cfg["Master:Email"];
        var senha = cfg["Master:Senha"];
        var nome = cfg["Master:Nome"] ?? "Master";
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(senha)) return;
        email = email.Trim().ToLowerInvariant();

        // Backfill: seed default categories for condominiums without any
        var condsSemCategoria = await db.Condominios
            .Where(c => !db.Categorias.Any(cat => cat.CondominioId == c.Id))
            .Select(c => c.Id).ToListAsync();
        foreach (var id in condsSemCategoria)
            Controllers.CadastroController.SeedCategorias(db, id);
        if (condsSemCategoria.Count > 0) await db.SaveChangesAsync();

        var existente = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
        if (existente is null)
        {
            db.Usuarios.Add(new Usuario
            {
                Email = email,
                Nome = nome,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha),
                Perfil = PerfilUsuario.Master,
                CondominioId = null
            });
            await db.SaveChangesAsync();
        }
        else if (existente.Perfil != PerfilUsuario.Master)
        {
            existente.Perfil = PerfilUsuario.Master;
            existente.CondominioId = null;
            await db.SaveChangesAsync();
        }
    }
}
