import { Routes, Route } from 'react-router-dom';
import Home from '../features/home/pages/Home';
import Login from '../features/auth/pages/Login';
import Feed from '../features/community/pages/Feed';
import IssuesList from '../features/issues/pages/IssuesList';
import CreateIssue from '../features/issues/pages/CreateIssue';
import GovDashboard from '../features/dashboard/pages/GovDashboard';
import FloodPrediction from '../features/ai_models/pages/FloodPrediction';
import DiseasePrediction from '../features/ai_models/pages/DiseasePrediction';
import InfraRisk from '../features/ai_models/pages/InfraRisk';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Login />} />
      <Route path="/community" element={<Feed />} />
      <Route path="/issues" element={<IssuesList />} />
      <Route path="/issues/new" element={<CreateIssue />} />
      <Route path="/dashboard" element={<GovDashboard />} />
      <Route path="/ai/flood" element={<FloodPrediction />} />
      <Route path="/ai/disease" element={<DiseasePrediction />} />
      <Route path="/ai/infra" element={<InfraRisk />} />
    </Routes>
  );
}
