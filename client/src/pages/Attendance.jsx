import { useSelector } from "react-redux";
import Content from "../components/employee/Attendance";
import HrContent from "../components/hr/AttendanceSummary";
export default function Attendance() {
  const role = useSelector((state) => state.auth.user.role);
  return role === "hr" ? <HrContent /> : <Content />;
}
