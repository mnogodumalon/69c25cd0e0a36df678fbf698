import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import VereinsversammlungenPage from '@/pages/VereinsversammlungenPage';
import MitgliederverwaltungPage from '@/pages/MitgliederverwaltungPage';
import RezeptePage from '@/pages/RezeptePage';
import ZutatenPage from '@/pages/ZutatenPage';
import PicknickPlanungPage from '@/pages/PicknickPlanungPage';
import FeaturesPage from '@/pages/FeaturesPage';
import TestergebnissePage from '@/pages/TestergebnissePage';
import FehlerberichtePage from '@/pages/FehlerberichtePage';

export default function App() {
  return (
    <HashRouter>
      <ActionsProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="vereinsversammlungen" element={<VereinsversammlungenPage />} />
            <Route path="mitgliederverwaltung" element={<MitgliederverwaltungPage />} />
            <Route path="rezepte" element={<RezeptePage />} />
            <Route path="zutaten" element={<ZutatenPage />} />
            <Route path="picknick-planung" element={<PicknickPlanungPage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="testergebnisse" element={<TestergebnissePage />} />
            <Route path="fehlerberichte" element={<FehlerberichtePage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </ActionsProvider>
    </HashRouter>
  );
}
