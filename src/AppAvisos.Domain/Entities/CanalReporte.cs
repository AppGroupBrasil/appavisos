namespace AppAvisos.Domain.Entities;

public class CanalReporte
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CondominioId { get; set; }
    public Condominio Condominio { get; set; } = null!;
    public Guid? AreaId { get; set; }
    public Area? Area { get; set; }

    public string Nome { get; set; } = "";
    public string? Descricao { get; set; }
    public bool IdentificacaoObrigatoria { get; set; } = true;
    public bool Ativo { get; set; } = true;
    public string Token { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 12);
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
