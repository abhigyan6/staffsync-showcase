import ProtectedRoute from "../../routes/ProtectedRoute";
import Content from "../employee/LeaveList";
export default function LeaveApplications() {
  return (
    <ProtectedRoute allowedRoles={["hr"]}>
      <Content />
    </ProtectedRoute>
  );
}
