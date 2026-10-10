import ProtectedRoute from "../routes/ProtectedRoute";
import Dashboard from "../components/shared/Dashboard";
export default function ManagerDashboard() {
  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      <Dashboard />
    </ProtectedRoute>
  );
}
