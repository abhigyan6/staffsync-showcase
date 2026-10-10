import ProtectedRoute from "../../routes/ProtectedRoute";
import Content from "../employee/Attendance";
export default function AttendanceSummary() {
  return (
    <ProtectedRoute allowedRoles={["hr"]}>
      <Content />
    </ProtectedRoute>
  );
}
