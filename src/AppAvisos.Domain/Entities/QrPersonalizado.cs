namespace AppAvisos.Domain.Entities;

public class QrPersonalizado
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CondominioId { get; set; }
    public Condominio Condominio { get; set; } = null!;
    public string Titulo { get; set; } = "";
    public string Descricao { get; set; } = "";
    public string Url { get; set; } = "";
    public int Ordem { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
