import Dashboard from './pages/Dashboard';
import NovaTriagem from './pages/NovaTriagem';
import Historico from './pages/Historico';
import Protocolos from './pages/Protocolos';
import Manual from './pages/Manual';
import Indicadores from './pages/Indicadores';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "NovaTriagem": NovaTriagem,
    "Historico": Historico,
    "Protocolos": Protocolos,
    "Manual": Manual,
    "Indicadores": Indicadores,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};