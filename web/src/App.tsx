import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Protegida } from './components/Protegida'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Sso = lazy(() => import('./pages/Sso'))
const CadastroCondominio = lazy(() => import('./pages/CadastroCondominio'))
const Avisos = lazy(() => import('./pages/sindico/Avisos'))
const NovoAviso = lazy(() => import('./pages/sindico/NovoAviso'))
const Recibos = lazy(() => import('./pages/sindico/Recibos'))
const Moradores = lazy(() => import('./pages/sindico/Moradores'))
const Blocos = lazy(() => import('./pages/sindico/Blocos'))
const Identidade = lazy(() => import('./pages/sindico/Identidade'))
const QrCodes = lazy(() => import('./pages/sindico/QrCodes'))
const Areas = lazy(() => import('./pages/sindico/Areas'))
const Timeline = lazy(() => import('./pages/sindico/Timeline'))
const Recuperar = lazy(() => import('./pages/Recuperar'))
const Redefinir = lazy(() => import('./pages/Redefinir'))
const DetalheAviso = lazy(() => import('./pages/morador/DetalheAviso'))
const Privacidade = lazy(() => import('./pages/Privacidade'))
const Termos = lazy(() => import('./pages/Termos'))
const Feed = lazy(() => import('./pages/morador/Feed'))
const CadastroPublico = lazy(() => import('./pages/morador/CadastroPublico'))
const EncontrarCondominio = lazy(() => import('./pages/morador/EncontrarCondominio'))
const AtivarPush = lazy(() => import('./pages/morador/AtivarPush'))
const Master = lazy(() => import('./pages/master/Master'))
const Reportar = lazy(() => import('./pages/Reportar'))
const SolicitacoesMoradores = lazy(() => import('./pages/sindico/SolicitacoesMoradores'))
const DocumentosSindico = lazy(() => import('./pages/sindico/Documentos'))
const DocumentosPublico = lazy(() => import('./pages/morador/Documentos'))
const MeusDocumentos = lazy(() => import('./pages/morador/MeusDocumentos'))
const MuralPublico = lazy(() => import('./pages/MuralPublico'))
const MuralArea = lazy(() => import('./pages/MuralArea'))
const Descadastrar = lazy(() => import('./pages/Descadastrar'))
const ExcluirConta = lazy(() => import('./pages/ExcluirConta'))

const Sindico = ['Sindico', 'Subsindico']

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sso" element={<Sso />} />
        <Route path="/cadastrar-condominio" element={<CadastroCondominio />} />
        <Route path="/cadastro/:slug" element={<CadastroPublico />} />
        <Route path="/c/:slug" element={<MuralPublico />} />
        <Route path="/c/:slug/area/:areaSlug" element={<MuralArea />} />
        <Route path="/c/:slug/reportar" element={<Reportar />} />
        <Route path="/c/:slug/reportar/:canal" element={<Reportar />} />
        <Route path="/painel/solicitacoes" element={<Protegida perfil={Sindico}><SolicitacoesMoradores /></Protegida>} />
        <Route path="/painel/reportes" element={<Navigate to="/painel/solicitacoes" replace />} />
        <Route path="/painel/canais-reporte" element={<Navigate to="/painel/solicitacoes?aba=canais" replace />} />
        <Route path="/painel/documentos" element={<Protegida perfil={Sindico}><DocumentosSindico /></Protegida>} />
        <Route path="/c/:slug/documentos" element={<DocumentosPublico />} />
        <Route path="/sou-morador" element={<EncontrarCondominio />} />
        <Route path="/ativar-notificacoes" element={<AtivarPush />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/redefinir/:token" element={<Redefinir />} />
        <Route path="/c/:slug/aviso/:id" element={<Protegida perfil="Morador"><DetalheAviso /></Protegida>} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/descadastrar" element={<Descadastrar />} />
        <Route path="/excluir-conta" element={<ExcluirConta />} />

        <Route path="/painel" element={<Protegida perfil={Sindico}><Avisos /></Protegida>} />
        <Route path="/painel/avisos/novo" element={<Protegida perfil={Sindico}><NovoAviso /></Protegida>} />
        <Route path="/painel/avisos/:id" element={<Protegida perfil={Sindico}><Recibos /></Protegida>} />
        <Route path="/painel/moradores" element={<Protegida perfil={Sindico}><Moradores /></Protegida>} />
        <Route path="/painel/blocos" element={<Protegida perfil={Sindico}><Blocos /></Protegida>} />
        <Route path="/painel/identidade" element={<Protegida perfil={Sindico}><Identidade /></Protegida>} />
        <Route path="/painel/qr" element={<Protegida perfil={Sindico}><QrCodes /></Protegida>} />
        <Route path="/painel/areas" element={<Protegida perfil={Sindico}><Areas /></Protegida>} />
        <Route path="/painel/timeline" element={<Protegida perfil={Sindico}><Timeline /></Protegida>} />

        <Route path="/feed" element={<Protegida perfil="Morador"><Feed /></Protegida>} />
        <Route path="/meus-documentos" element={<Protegida perfil="Morador"><MeusDocumentos /></Protegida>} />
        <Route path="/master" element={<Protegida perfil="Master"><Master /></Protegida>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
