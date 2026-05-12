using AppAvisos.Domain.Enums;

namespace AppAvisos.Domain.Entities;

public class Morador
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CondominioId { get; set; }
    public Condominio Condominio { get; set; } = null!;
    public Guid? BlocoId { get; set; }
    public Bloco? Bloco { get; set; }
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Telefone { get; set; }
    public string? Apartamento { get; set; }
    public string? SenhaHash { get; set; }
    public StatusMorador Status { get; set; } = StatusMorador.Pendente;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime? AprovadoEm { get; set; }
    public bool EmailInvalido { get; set; }
    public string? TokenReset { get; set; }
    public DateTime? TokenResetExpiraEm { get; set; }
}
