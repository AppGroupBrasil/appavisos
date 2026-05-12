namespace AppAvisos.Domain.Entities;

public class Area
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CondominioId { get; set; }
    public Condominio Condominio { get; set; } = null!;
    public string Nome { get; set; } = "";
    public string Slug { get; set; } = "";
    public int Ordem { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
