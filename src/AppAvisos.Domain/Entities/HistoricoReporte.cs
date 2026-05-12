using AppAvisos.Domain.Enums;

namespace AppAvisos.Domain.Entities;

public class HistoricoReporte
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReporteId { get; set; }
    public Reporte Reporte { get; set; } = null!;
    public StatusReporte Status { get; set; }
    public string AutorNome { get; set; } = "";
    public string AutorPerfil { get; set; } = "";
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
