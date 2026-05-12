namespace AppAvisos.Domain.Entities;

public class CategoriaAviso
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CondominioId { get; set; }
    public Condominio Condominio { get; set; } = null!;
    public string Nome { get; set; } = "";
    public int Ordem { get; set; }
}
