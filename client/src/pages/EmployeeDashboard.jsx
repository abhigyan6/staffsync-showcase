import ProtectedRoute from "../routes/ProtectedRoute";
import Dashboard from "../components/shared/Dashboard";
export default function EmployeeDashboard() {
  return (
    <ProtectedRoute allowedRoles={["employee"]}>
      <Dashboard />
    </ProtectedRoute>
  );
}
