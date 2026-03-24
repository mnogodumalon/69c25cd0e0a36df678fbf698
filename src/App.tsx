import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import MitgliederverwaltungPage from '@/pages/MitgliederverwaltungPage';
import VereinsversammlungenPage from '@/pages/VereinsversammlungenPage';

export default function App() {
  return (
    <HashRouter>
      <ActionsProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="mitgliederverwaltung" element={<MitgliederverwaltungPage />} />
            <Route path="vereinsversammlungen" element={<VereinsversammlungenPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </ActionsProvider>
    </HashRouter>
  );
}
