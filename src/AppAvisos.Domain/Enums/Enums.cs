namespace AppAvisos.Domain.Enums;

public enum PerfilUsuario { Sindico = 1, Subsindico = 2, Morador = 3, Master = 99 }
public enum StatusMorador { Pendente = 1, Ativo = 2, Inativo = 3 }
public enum EscopoAviso { Condominio = 1, Bloco = 2, Morador = 3, Area = 4 }
public enum TipoMensagem { Aviso = 1, Comunicado = 2, Informativo = 3, Notificacao = 4 }
public enum AutorMensagem { Sindico = 1, Morador = 2 }
public enum TemplateAviso { Padrao = 1, Urgente = 2, Manutencao = 4 }
