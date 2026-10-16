import { useState } from "react";
import { useSelector } from "react-redux";
import { Button, TextField, IconButton, Tooltip } from "@mui/material";
import { CalendarCheck, PencilSimple } from "@phosphor-icons/react";
import { useResource, useApp } from "../../hooks";
import { api, message, dateLabel, hours, fullName } from "../../api";
import {
  PageHeading,
  Panel,
  Person,
  Status,
  Loading,
  Failure,
  Empty,
  Pager,
  FormDialog,
  Field,
} from "../../components";
const timeLabel = (t) =>
  t
    ? new Date(t).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "—";
export default function Attendance() {
  const user = useSelector((s) => s.auth.user),
    employee = user.role === "employee",
    hr = user.role === "hr";
  const { toast, refresh } = useApp();
  const [date, setDate] = useState(""),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(null),
    [values, setValues] = useState({ status: "present", note: "" }),
    [error, setError] = useState("");
  const list = useResource(
      "/attendance?" + new URLSearchParams({ date, page: String(page) }),
    ),
    dashboard = useResource("/dashboard");
  const own = dashboard.data?.attendance.find(
    (a) => a.employee?._id === user.employee?._id,
  );
  async function mark() {
    setBusy(true);
    try {
      await api.post(own ? "/attendance/check-out" : "/attendance/check-in");
      toast(own ? "Checked out successfully." : "Checked in successfully.");
      refresh();
    } catch (e) {
      toast(message(e), "error");
    } finally {
      setBusy(false);
    }
  }
  async function correct(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch(`/attendance/${editing._id}`, values);
      toast("Attendance updated.");
      refresh();
      setEditing(null);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Attendance"
        description={
          employee
            ? "Keep a record of your working day."
            : "A dependable record of your team’s time."
        }
      >
        {employee && (
          <Button
            variant="contained"
            startIcon={<CalendarCheck size={18} />}
            onClick={mark}
            disabled={busy || !!own?.checkOut}
          >
            {own?.checkOut ? "Day complete" : own ? "Check out" : "Check in"}
          </Button>
        )}
      </PageHeading>
      {employee && (
        <div className="attendance-today">
          <div>
            <span>Today’s status</span>
            <strong>
              {own?.checkOut
                ? "Checked out"
                : own
                  ? "Checked in"
                  : "Not checked in"}
            </strong>
          </div>
          <div>
            <span>Check-in</span>
            <strong>{timeLabel(own?.checkIn)}</strong>
          </div>
          <div>
            <span>Check-out</span>
            <strong>{timeLabel(own?.checkOut)}</strong>
          </div>
          <div>
            <span>Recorded hours</span>
            <strong>
              {own && hours(own)
                ? hours(own) + " h"
                : own?.checkIn
                  ? "In progress"
                  : "—"}
            </strong>
          </div>
        </div>
      )}
      <Panel
        title={employee ? "My attendance history" : "Attendance records"}
        description="All times are shown in India Standard Time (IST)"
      >
        <div className="toolbar">
          <TextField
            label="Attendance date"
            type="date"
            size="small"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {date && (
            <Button
              color="inherit"
              onClick={() => {
                setDate("");
                setPage(1);
              }}
            >
              Clear date
            </Button>
          )}
        </div>
        {list.error ? (
          <Failure error={list.error} retry={list.refresh} />
        ) : list.loading && !list.data ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <Empty
            title="No attendance records"
            description="Records appear after employees check in."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {!employee && <th>Employee</th>}
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Hours</th>
                    <th>Status</th>
                    {hr && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((a) => (
                    <tr key={a._id}>
                      {!employee && (
                        <td>
                          <Person person={a.employee} />
                        </td>
                      )}
                      <td>
                        {dateLabel(a.date, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td>{timeLabel(a.checkIn)}</td>
                      <td>{timeLabel(a.checkOut)}</td>
                      <td>
                        {hours(a)
                          ? hours(a) + " h"
                          : a.checkIn
                            ? "In progress"
                            : "—"}
                      </td>
                      <td>
                        <Status value={a.status} />
                      </td>
                      {hr && (
                        <td>
                          <Tooltip title="Correct attendance">
                            <IconButton
                              aria-label={`Correct attendance for ${fullName(a.employee)}`}
                              onClick={() => {
                                setEditing(a);
                                setValues({
                                  status: a.status,
                                  note: a.note || "",
                                });
                                setError("");
                              }}
                            >
                              <PencilSimple size={19} />
                            </IconButton>
                          </Tooltip>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager total={list.data.total} page={page} setPage={setPage} />
          </>
        )}
      </Panel>
      <FormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Correct attendance"
        subtitle="Changes are recorded in the workspace audit history."
        onSubmit={correct}
        busy={busy}
        error={error}
      >
        <Field
          name="status"
          label="Attendance status"
          options={["present", "late", "absent", "leave", "half-day"].map(
            (s) => ({
              value: s,
              label:
                s === "leave" ? "On leave" : s[0].toUpperCase() + s.slice(1),
            }),
          )}
          values={values}
          setValues={setValues}
        />
        <Field
          name="note"
          label="Reason for correction"
          multiline
          rows={3}
          values={values}
          setValues={setValues}
        />
      </FormDialog>
    </>
  );
}
