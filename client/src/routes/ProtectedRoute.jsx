import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { Loading } from "../components";
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, status } = useSelector((s) => s.auth);
  if (status === "loading") return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (
    allowedRoles &&
    !allowedRoles.map((r) => r.toLowerCase()).includes(user.role)
  )
    return <Navigate to="/dashboard" replace />;
  return children;
}
