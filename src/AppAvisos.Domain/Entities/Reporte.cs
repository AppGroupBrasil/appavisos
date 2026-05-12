using AppAvisos.Domain.Enums;

namespace AppAvisos.Domain.Entities;

public class Reporte
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CondominioId { get; set; }
    public Condominio Condominio { get; set; } = null!;
    public Guid? AreaId { get; set; }
    public Area? Area { get; set; }

    public CategoriaReporte Categoria { get; set; }
    public string Titulo { get; set; } = "";
    public string Descricao { get; set; } = "";
    public string FotosJson { get; set; } = "[]";

    public string? Nome { get; set; }
    public string? Bloco { get; set; }
    public string? Apartamento { get; set; }
    public string? Telefone { get; set; }
    public string? Email { get; set; }

    public StatusReporte Status { get; set; } = StatusReporte.Aberto;
    public string? Resposta { get; set; }
    public DateTime? RespondidoEm { get; set; }
    public string? RespondidoPor { get; set; }

    public string TokenPublico { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 12);
    public string Protocolo { get; set; } = "";
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
