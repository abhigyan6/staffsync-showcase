import { useState } from "react";
import { Button, TextField } from "@mui/material";
import {
  DownloadSimple,
  Clock,
  CalendarCheck,
  CalendarBlank,
} from "@phosphor-icons/react";
import { useResource } from "../hooks";
import { downloadCsv, fullName } from "../api";
import {
  PageHeading,
  Panel,
  Person,
  Loading,
  Failure,
  Empty,
} from "../components";
export default function Reports() {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  const report = useResource("/reports?" + q);
  function exportData() {
    const d = report.data;
    downloadCsv(
      `staffsync-attendance-${d.from}-${d.to}.csv`,
      [
        "Employee ID",
        "Employee",
        "Department",
        "Present days",
        "Late days",
        "Half days",
        "Recorded absent days",
        "Approved leave calendar days",
        "Completed hours",
      ],
      d.items.map((i) => [
        i.employee.employeeId,
        fullName(i.employee),
        i.employee.department,
        i.present,
        i.late,
        i.halfDay,
        i.absent,
        i.leaveDays,
        i.hours,
      ]),
    );
  }
  return (
    <>
      <PageHeading
        title="Reports & insights"
        description="A clear record to support your people decisions."
      >
        <Button
          variant="contained"
          startIcon={<DownloadSimple size={18} />}
          onClick={exportData}
          disabled={!report.data || !!report.error}
        >
          Export CSV
        </Button>
      </PageHeading>
      <div className="report-filters">
        <TextField
          label="From"
          type="date"
          size="small"
          value={from || report.data?.from || ""}
          onChange={(e) => setFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          value={to || report.data?.to || ""}
          onChange={(e) => setTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <span className="muted">
          Attendance and approved leave in your selected period
        </span>
      </div>
      {report.error ? (
        <Failure error={report.error} retry={report.refresh} />
      ) : report.loading && !report.data ? (
        <Loading />
      ) : (
        report.data && (
          <>
            <div className="metrics report-metrics">
              {[
                [
                  "Attendance records",
                  report.data.totals.present,
                  "present days recorded",
                  CalendarCheck,
                ],
                [
                  "Completed hours",
                  report.data.totals.hours,
                  "from check-in and check-out",
                  Clock,
                ],
                [
                  "Approved leave days",
                  report.data.totals.leaveDays,
                  "calendar days in this period",
                  CalendarBlank,
                ],
              ].map(([label, value, detail, Icon]) => (
                <div className="metric" key={label}>
                  <div className="metric-top">
                    <span>{label}</span>
                    <Icon size={21} />
                  </div>
                  <div className="metric-value">{value}</div>
                  <p>{detail}</p>
                </div>
              ))}
            </div>
            <Panel
              title="Employee attendance report"
              description="Missing records are not automatically counted as absences. This report does not calculate payroll."
            >
              {report.data.items.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Present</th>
                        <th>Late</th>
                        <th>Half days</th>
                        <th>Recorded absent</th>
                        <th>Leave days</th>
                        <th>Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.data.items.map((i) => (
                        <tr key={i.employee._id}>
                          <td>
                            <Person person={i.employee} />
                          </td>
                          <td>{i.present}</td>
                          <td>{i.late}</td>
                          <td>{i.halfDay}</td>
                          <td>{i.absent}</td>
                          <td>{i.leaveDays}</td>
                          <td>
                            <strong>{i.hours} h</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="No active employees" />
              )}
            </Panel>
          </>
        )
      )}
    </>
  );
}
