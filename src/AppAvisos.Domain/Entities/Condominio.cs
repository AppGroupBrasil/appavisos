namespace AppAvisos.Domain.Entities;

public class Condominio
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = "";
    public string Slug { get; set; } = "";
    public string? DescricaoCurta { get; set; }
    public string? Endereco { get; set; }
    public string? Cnpj { get; set; }
    public string? TelefoneContato { get; set; }
    public string? EmailContato { get; set; }
    public string? Site { get; set; }
    public string? LogoUrl { get; set; }
    public string? CorPrimaria { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public bool Bloqueado { get; set; }
    public DateTime? BloqueadoEm { get; set; }
    public string? MotivoBloqueio { get; set; }
    public bool Inadimplente { get; set; }
    public DateTime? UltimoPagamentoEm { get; set; }
    public string? ObservacoesMaster { get; set; }

    public List<Bloco> Blocos { get; set; } = new();
    public List<Morador> Moradores { get; set; } = new();
    public List<Aviso> Avisos { get; set; } = new();
}
