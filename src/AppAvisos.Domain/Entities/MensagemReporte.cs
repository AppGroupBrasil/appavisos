namespace AppAvisos.Domain.Entities;

public class MensagemReporte
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReporteId { get; set; }
    public Reporte Reporte { get; set; } = null!;
    public string AutorNome { get; set; } = "";
    public string AutorPerfil { get; set; } = "";
    public string Texto { get; set; } = "";
    public string FotosJson { get; set; } = "[]";
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
