import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import LogsAuditoria from './pages/LogsAuditoria';
import GestaoTrombolise from './pages/GestaoTrombolise';
import RelatorioFarmacia from './pages/RelatorioFarmacia';
import CadastroPerfil from './pages/CadastroPerfil';
import AcessoPendente from './pages/AcessoPendente';
import SolicitarAcesso from './pages/SolicitarAcesso';
import GerenciarAcessos from './pages/GerenciarAcessos';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import StatusGuard from '@/components/StatusGuard';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      // Usuário autenticado via GOV.BR mas não registrado no app → mostrar página de solicitação diretamente
      return <SolicitarAcesso />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Usuário não autenticado: redirecionar para login GOV.BR (única forma de entrar)
  if (!isAuthenticated) {
    navigateToLogin();
    return null;
  }

  // Render the main app — rotas públicas (sem Layout/sidebar) ficam fora do LayoutWrapper
  return (
    <Routes>
      {/* Rotas sem sidebar: cadastro e acesso pendente */}
      <Route path="/CadastroPerfil" element={<CadastroPerfil />} />
      <Route path="/AcessoPendente" element={<AcessoPendente />} />
      <Route path="/SolicitarAcesso" element={<SolicitarAcesso />} />

      {/* Rotas com sidebar — protegidas pelo StatusGuard (exige status_acesso ATIVO) */}
      <Route path="/*" element={
        <StatusGuard>
        <LayoutWrapper currentPageName={mainPageKey}>
          <Routes>
            <Route path="/" element={<MainPage />} handle={{ pageName: mainPageKey }} />
            {Object.entries(Pages).map(([path, Page]) => (
              <Route key={path} path={`/${path}`} element={<Page />} handle={{ pageName: path }} />
            ))}
            <Route path="/LogsAuditoria" element={<LogsAuditoria />} />
            <Route path="/GestaoTrombolise" element={<GestaoTrombolise />} />
            <Route path="/RelatorioFarmacia" element={<RelatorioFarmacia />} />
            <Route path="/GerenciarAcessos" element={<GerenciarAcessos />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </LayoutWrapper>
        </StatusGuard>
      } />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App