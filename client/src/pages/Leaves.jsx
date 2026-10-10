import { useSelector } from "react-redux";
import EmployeeLeaves from "../components/employee/LeaveList";
import HrLeaves from "../components/hr/LeaveApplications";
import ManagerLeaves from "../components/manager/LeaveApplications";
export default function Leaves() {
  const role = useSelector((state) => state.auth.user.role);
  return role === "hr" ? (
    <HrLeaves />
  ) : role === "manager" ? (
    <ManagerLeaves />
  ) : (
    <EmployeeLeaves />
  );
}
