using AppAvisos.Domain.Enums;

namespace AppAvisos.Domain.Entities;

public class Aviso
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CondominioId { get; set; }
    public Condominio Condominio { get; set; } = null!;
    public Guid AutorId { get; set; }
    public string QrToken { get; set; } = "";

    public string Titulo { get; set; } = "";
    public string Texto { get; set; } = "";
    public TemplateAviso Template { get; set; } = TemplateAviso.Padrao;
    public TipoMensagem Tipo { get; set; } = TipoMensagem.Aviso;
    public Guid? CategoriaId { get; set; }
    public CategoriaAviso? Categoria { get; set; }

    public EscopoAviso Escopo { get; set; }
    public Guid? BlocoId { get; set; }
    public Guid? MoradorId { get; set; }
    public Guid? AreaId { get; set; }
    public Area? Area { get; set; }

    public bool Urgente { get; set; }
    public bool Fixado { get; set; }
    public DateTime? PublicarEm { get; set; }
    public DateTime? ValidoAte { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime? PublicadoEm { get; set; }
    public DateTime? ArquivadoEm { get; set; }

    public string? AnexoUrl { get; set; }
    public string? AnexoNome { get; set; }
    public long? AnexoTamanho { get; set; }

    public List<AvisoRecibo> Recibos { get; set; } = new();
}
