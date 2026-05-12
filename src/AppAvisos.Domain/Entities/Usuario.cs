using AppAvisos.Domain.Enums;

namespace AppAvisos.Domain.Entities;

public class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? CondominioId { get; set; }
    public Condominio? Condominio { get; set; }
    public string Email { get; set; } = "";
    public string SenhaHash { get; set; } = "";
    public string Nome { get; set; } = "";
    public PerfilUsuario Perfil { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime? UltimoLogin { get; set; }
    public string? TokenReset { get; set; }
    public DateTime? TokenResetExpiraEm { get; set; }
}
