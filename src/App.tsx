import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import WorkflowPage from './pages/WorkflowPage';
import HITLCompliance from './components/HITLCompliance';
import HITLUnderwriter from './components/HITLUnderwriter';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/workflow/:workflowId" element={<WorkflowPage />} />
      <Route path="/hitl/compliance/:reviewId" element={<HITLCompliance />} />
      <Route path="/hitl/underwriting/:reviewId" element={<HITLUnderwriter />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
