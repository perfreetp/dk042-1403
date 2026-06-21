import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import IncidentReport from "@/pages/IncidentReport";
import ResourceMatch from "@/pages/ResourceMatch";
import Tracking from "@/pages/Tracking";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/incident" replace />} />
          <Route path="/incident" element={<IncidentReport />} />
          <Route path="/resources" element={<ResourceMatch />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="*" element={<Navigate to="/incident" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
