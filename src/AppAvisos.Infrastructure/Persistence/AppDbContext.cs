using AppAvisos.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AppAvisos.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Condominio> Condominios => Set<Condominio>();
    public DbSet<Bloco> Blocos => Set<Bloco>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Morador> Moradores => Set<Morador>();
    public DbSet<Aviso> Avisos => Set<Aviso>();
    public DbSet<AvisoRecibo> AvisoRecibos => Set<AvisoRecibo>();
    public DbSet<CategoriaAviso> Categorias => Set<CategoriaAviso>();
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<TimelineMensagem> Timeline => Set<TimelineMensagem>();
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();
    public DbSet<Reporte> Reportes => Set<Reporte>();
    public DbSet<HistoricoReporte> HistoricosReporte => Set<HistoricoReporte>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Condominio>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Nome).HasMaxLength(160).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(80).IsRequired();
        });

        b.Entity<Bloco>(e =>
        {
            e.HasIndex(x => new { x.CondominioId, x.Nome }).IsUnique();
            e.Property(x => x.Nome).HasMaxLength(80).IsRequired();
        });

        b.Entity<Usuario>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.Nome).HasMaxLength(160).IsRequired();
        });

        b.Entity<Morador>(e =>
        {
            e.HasIndex(x => new { x.CondominioId, x.Email }).IsUnique();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.Nome).HasMaxLength(160).IsRequired();
            e.Property(x => x.Telefone).HasMaxLength(30);
            e.Property(x => x.Apartamento).HasMaxLength(20);
        });

        b.Entity<Aviso>(e =>
        {
            e.HasIndex(x => x.QrToken).IsUnique();
            e.HasIndex(x => new { x.CondominioId, x.CriadoEm });
            e.Property(x => x.QrToken).HasMaxLength(16).IsRequired();
            e.Property(x => x.Titulo).HasMaxLength(200).IsRequired();
        });

        b.Entity<AvisoRecibo>(e =>
        {
            e.HasIndex(x => new { x.AvisoId, x.MoradorId }).IsUnique();
            e.HasOne(x => x.Aviso).WithMany(x => x.Recibos).HasForeignKey(x => x.AvisoId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CategoriaAviso>(e =>
        {
            e.HasIndex(x => new { x.CondominioId, x.Nome }).IsUnique();
            e.Property(x => x.Nome).HasMaxLength(80).IsRequired();
        });

        b.Entity<Area>(e =>
        {
            e.HasIndex(x => new { x.CondominioId, x.Slug }).IsUnique();
            e.Property(x => x.Nome).HasMaxLength(80).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(80).IsRequired();
        });

        b.Entity<TimelineMensagem>(e =>
        {
            e.HasIndex(x => new { x.AvisoId, x.MoradorId, x.CriadoEm });
            e.Property(x => x.Texto).IsRequired();
            e.Property(x => x.AutorNome).HasMaxLength(160);
            e.HasOne(x => x.Aviso).WithMany().HasForeignKey(x => x.AvisoId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<PushSubscription>(e =>
        {
            e.HasIndex(x => x.Endpoint).IsUnique();
            e.Property(x => x.Endpoint).HasMaxLength(500).IsRequired();
        });

        b.Entity<Reporte>(e =>
        {
            e.HasIndex(x => x.TokenPublico).IsUnique();
            e.HasIndex(x => x.Protocolo).IsUnique().HasFilter("\"Protocolo\" <> ''");
            e.Property(x => x.Protocolo).HasMaxLength(10).IsRequired();
            e.HasIndex(x => new { x.CondominioId, x.CriadoEm });
            e.Property(x => x.Titulo).HasMaxLength(160).IsRequired();
            e.Property(x => x.Descricao).IsRequired();
            e.Property(x => x.Nome).HasMaxLength(160);
            e.Property(x => x.Bloco).HasMaxLength(80);
            e.Property(x => x.Apartamento).HasMaxLength(20);
            e.Property(x => x.Telefone).HasMaxLength(30);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.TokenPublico).HasMaxLength(20).IsRequired();
            e.Property(x => x.FotosJson).IsRequired();
            e.HasOne(x => x.Condominio).WithMany().HasForeignKey(x => x.CondominioId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Area).WithMany().HasForeignKey(x => x.AreaId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<HistoricoReporte>(e =>
        {
            e.HasIndex(x => new { x.ReporteId, x.CriadoEm });
            e.Property(x => x.AutorNome).HasMaxLength(160);
            e.Property(x => x.AutorPerfil).HasMaxLength(40);
            e.HasOne(x => x.Reporte).WithMany().HasForeignKey(x => x.ReporteId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
