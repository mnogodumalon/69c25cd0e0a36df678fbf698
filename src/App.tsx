import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import VereinsversammlungenPage from '@/pages/VereinsversammlungenPage';
import MitgliederverwaltungPage from '@/pages/MitgliederverwaltungPage';
import ZutatenPage from '@/pages/ZutatenPage';
import RezeptePage from '@/pages/RezeptePage';
import PicknickPlanungPage from '@/pages/PicknickPlanungPage';

export default function App() {
  return (
    <HashRouter>
      <ActionsProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="vereinsversammlungen" element={<VereinsversammlungenPage />} />
            <Route path="mitgliederverwaltung" element={<MitgliederverwaltungPage />} />
            <Route path="zutaten" element={<ZutatenPage />} />
            <Route path="rezepte" element={<RezeptePage />} />
            <Route path="picknick-planung" element={<PicknickPlanungPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </ActionsProvider>
    </HashRouter>
  );
}
