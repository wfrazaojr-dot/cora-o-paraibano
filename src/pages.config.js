/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ASSCARDIODetalhe from './pages/ASSCARDIODetalhe';
import AcessoProfissional from './pages/AcessoProfissional';
import Administracao from './pages/Administracao';
import CERHDetalhe from './pages/CERHDetalhe';
import CadastroProfissional from './pages/CadastroProfissional';
import Cardiologia from './pages/Cardiologia';
import CentralSES from './pages/CentralSES';
import CoracaoParaibano from './pages/CoracaoParaibano';
import Dashboard from './pages/Dashboard';
import FormularioVaga from './pages/FormularioVaga';
import HemodinamicaDetalhe from './pages/HemodinamicaDetalhe';
import Historico from './pages/Historico';
import HistoricoUnidades from './pages/HistoricoUnidades';
import Home from './pages/Home';
import Indicadores from './pages/Indicadores';
import Inicio from './pages/Inicio';
import Manual from './pages/Manual';
import NovaTriagem from './pages/NovaTriagem';
import PINLogin from './pages/PINLogin';
import PainelInicial from './pages/PainelInicial';
import PerfilSelection from './pages/PerfilSelection';
import ProtocoloEstrategias from './pages/ProtocoloEstrategias';
import Protocolos from './pages/Protocolos';
import RecuperarPIN from './pages/RecuperarPIN';
import TransporteDetalhe from './pages/TransporteDetalhe';
import MonitorTransportes from './pages/MonitorTransportes';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ASSCARDIODetalhe": ASSCARDIODetalhe,
    "AcessoProfissional": AcessoProfissional,
    "Administracao": Administracao,
    "CERHDetalhe": CERHDetalhe,
    "CadastroProfissional": CadastroProfissional,
    "Cardiologia": Cardiologia,
    "CentralSES": CentralSES,
    "CoracaoParaibano": CoracaoParaibano,
    "Dashboard": Dashboard,
    "FormularioVaga": FormularioVaga,
    "HemodinamicaDetalhe": HemodinamicaDetalhe,
    "Historico": Historico,
    "HistoricoUnidades": HistoricoUnidades,
    "Home": Home,
    "Indicadores": Indicadores,
    "Inicio": Inicio,
    "Manual": Manual,
    "NovaTriagem": NovaTriagem,
    "PINLogin": PINLogin,
    "PainelInicial": PainelInicial,
    "PerfilSelection": PerfilSelection,
    "ProtocoloEstrategias": ProtocoloEstrategias,
    "Protocolos": Protocolos,
    "RecuperarPIN": RecuperarPIN,
    "TransporteDetalhe": TransporteDetalhe,
    "MonitorTransportes": MonitorTransportes,
}

export const pagesConfig = {
    mainPage: "FormularioVaga",
    Pages: PAGES,
    Layout: __Layout,
};