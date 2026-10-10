import ProtectedRoute from "../../routes/ProtectedRoute";
import Content from "../employee/Announcements";
export default function AnnouncementsManager() {
  return (
    <ProtectedRoute allowedRoles={["hr"]}>
      <Content />
    </ProtectedRoute>
  );
}
