import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { DemoProvider } from './lib/DemoContext';
import ApplyPage from './pages/ApplyPage';
import CaseFilePage from './pages/CaseFilePage';
import ComparePage from './pages/ComparePage';
import Home from './pages/Home';
import { TopBar } from './ui/TopBar';

function WorkflowRedirect() {
  const { workflowId } = useParams();
  return <Navigate to={`/apply/${workflowId ?? 'new'}`} replace />;
}

export default function App() {
  return (
    <DemoProvider>
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply/:workflowId" element={<ApplyPage />} />
        <Route path="/case/:personaId" element={<CaseFilePage />} />
        <Route path="/compare" element={<ComparePage />} />
        {/* Links from the previous version of the demo */}
        <Route path="/workflow/:workflowId" element={<WorkflowRedirect />} />
        <Route path="/dashboard" element={<Navigate to="/case/happy-path" replace />} />
        <Route path="/hitl/compliance/:id" element={<Navigate to="/case/watchlist-hit" replace />} />
        <Route path="/hitl/underwriting/:id" element={<Navigate to="/case/borderline-credit" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DemoProvider>
  );
}
