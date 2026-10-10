import { useSelector } from "react-redux";
import Content from "../components/employee/Announcements";
import HrContent from "../components/hr/AnnouncementsManager";
export default function Announcements() {
  const role = useSelector((state) => state.auth.user.role);
  return role === "hr" ? <HrContent /> : <Content />;
}
