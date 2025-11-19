import Dashboard from './pages/Dashboard';
import NovaTriagem from './pages/NovaTriagem';
import Historico from './pages/Historico';
import Protocolos from './pages/Protocolos';
import Manual from './pages/Manual';
import Indicadores from './pages/Indicadores';
import Administracao from './pages/Administracao';
import PINLogin from './pages/PINLogin';
import RecuperarPIN from './pages/RecuperarPIN';
import CadastroProfissional from './pages/CadastroProfissional';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "NovaTriagem": NovaTriagem,
    "Historico": Historico,
    "Protocolos": Protocolos,
    "Manual": Manual,
    "Indicadores": Indicadores,
    "Administracao": Administracao,
    "PINLogin": PINLogin,
    "RecuperarPIN": RecuperarPIN,
    "CadastroProfissional": CadastroProfissional,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};