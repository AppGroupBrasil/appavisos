import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { useAuth } from './lib/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import CadastroCondominio from './pages/CadastroCondominio'
import Avisos from './pages/sindico/Avisos'
import NovoAviso from './pages/sindico/NovoAviso'
import Recibos from './pages/sindico/Recibos'
import Moradores from './pages/sindico/Moradores'
import Blocos from './pages/sindico/Blocos'
import Identidade from './pages/sindico/Identidade'
import QrCodes from './pages/sindico/QrCodes'
import Areas from './pages/sindico/Areas'
import Timeline from './pages/sindico/Timeline'
import Recuperar from './pages/Recuperar'
import Redefinir from './pages/Redefinir'
import DetalheAviso from './pages/morador/DetalheAviso'
import Privacidade from './pages/Privacidade'
import Termos from './pages/Termos'
import Feed from './pages/morador/Feed'
import CadastroPublico from './pages/morador/CadastroPublico'
import EncontrarCondominio from './pages/morador/EncontrarCondominio'
import AtivarPush from './pages/morador/AtivarPush'
import Master from './pages/master/Master'
import Reportar from './pages/Reportar'
import Reportes from './pages/sindico/Reportes'
import CanaisReporte from './pages/sindico/CanaisReporte'
import DocumentosSindico from './pages/sindico/Documentos'
import DocumentosPublico from './pages/morador/Documentos'

function Protegida({ children, perfil }: { children: React.ReactNode; perfil?: string | string[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (perfil) {
    const perfis = Array.isArray(perfil) ? perfil : [perfil]
    if (!perfis.includes(user.perfil)) return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const Sindico = ['Sindico', 'Subsindico']

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastrar-condominio" element={<CadastroCondominio />} />
        <Route path="/cadastro/:slug" element={<CadastroPublico />} />
        <Route path="/c/:slug/reportar" element={<Reportar />} />
        <Route path="/c/:slug/reportar/:canal" element={<Reportar />} />
        <Route path="/painel/reportes" element={<Protegida perfil={Sindico}><Reportes /></Protegida>} />
        <Route path="/painel/canais-reporte" element={<Protegida perfil={Sindico}><CanaisReporte /></Protegida>} />
        <Route path="/painel/documentos" element={<Protegida perfil={Sindico}><DocumentosSindico /></Protegida>} />
        <Route path="/c/:slug/documentos" element={<DocumentosPublico />} />
        <Route path="/sou-morador" element={<EncontrarCondominio />} />
        <Route path="/ativar-notificacoes" element={<AtivarPush />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/redefinir/:token" element={<Redefinir />} />
        <Route path="/aviso/:id" element={<Protegida perfil="Morador"><DetalheAviso /></Protegida>} />
        <Route path="/c/:slug/aviso/:id" element={<Protegida perfil="Morador"><DetalheAviso /></Protegida>} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/termos" element={<Termos />} />

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
        <Route path="/master" element={<Protegida perfil="Master"><Master /></Protegida>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
