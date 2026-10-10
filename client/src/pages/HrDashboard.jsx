import ProtectedRoute from "../routes/ProtectedRoute";
import Dashboard from "../components/shared/Dashboard";
export default function HrDashboard() {
  return (
    <ProtectedRoute allowedRoles={["hr"]}>
      <Dashboard />
    </ProtectedRoute>
  );
}
