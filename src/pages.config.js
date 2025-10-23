import Dashboard from './pages/Dashboard';
import NovaTriagem from './pages/NovaTriagem';
import Historico from './pages/Historico';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "NovaTriagem": NovaTriagem,
    "Historico": Historico,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};