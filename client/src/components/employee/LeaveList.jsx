import LeaveApply from "./LeaveApply";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Button, Tabs, Tab } from "@mui/material";
import { Plus, CalendarBlank } from "@phosphor-icons/react";
import { useApp, useResource } from "../../hooks";
import { api, message, dateLabel } from "../../api";
import {
  PageHeading,
  Panel,
  Person,
  Status,
  Loading,
  Failure,
  Empty,
  Pager,
  LeaveReview,
} from "../../components";
const defaults = { type: "Annual", startDate: "", endDate: "", reason: "" };
export default function Leaves() {
  const user = useSelector((s) => s.auth.user),
    employee = user.role === "employee";
  const { toast, refresh } = useApp();
  const [params] = useSearchParams();
  const [status, setStatus] = useState(params.get("status") || ""),
    [page, setPage] = useState(1),
    [open, setOpen] = useState(false),
    [values, setValues] = useState(defaults),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [review, setReview] = useState(null);
  const list = useResource(
    "/leaves?" + new URLSearchParams({ status, page: String(page) }),
  );
  async function apply(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/leaves", values);
      toast("Leave request submitted.");
      setOpen(false);
      setValues(defaults);
      refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function cancel(id) {
    setBusy(true);
    try {
      await api.patch(`/leaves/${id}/cancel`);
      toast("Leave request cancelled.");
      refresh();
    } catch (e) {
      toast(message(e), "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Time off"
        description={
          employee
            ? "Plan a break and keep track of your leave requests."
            : "Help your people make space for life outside work."
        }
      >
        {employee && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => {
              setOpen(true);
              setError("");
            }}
          >
            Request leave
          </Button>
        )}
      </PageHeading>
      <div className="info-banner">
        <CalendarBlank size={23} />
        <div>
          <strong>
            {employee
              ? "Time away, without the back-and-forth."
              : "Clear decisions. Better planning."}
          </strong>
          <p>
            {employee
              ? "Submit your dates and a reason. Your manager or HR will review your request."
              : "Either HR or the employee’s manager can make the final decision. Every decision is recorded."}
          </p>
        </div>
      </div>
      <Panel
        title={employee ? "My requests" : "Leave requests"}
        action={<span className="muted">{list.data?.total || 0} requests</span>}
      >
        <Tabs
          value={status}
          onChange={(_, v) => {
            setStatus(v);
            setPage(1);
          }}
          className="table-tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {[
            ["", "All requests"],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
            ["cancelled", "Cancelled"],
          ].map(([v, l]) => (
            <Tab key={v} value={v} label={l} />
          ))}
        </Tabs>
        {list.error ? (
          <Failure error={list.error} retry={list.refresh} />
        ) : list.loading && !list.data ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <Empty
            title="No requests here"
            description={
              employee
                ? "Your requests will appear here once you apply."
                : "Requests matching this status will appear here."
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {!employee && <th>Employee</th>}
                    <th>Leave type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>{employee ? "Details" : "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((l) => (
                    <tr key={l._id}>
                      {!employee && (
                        <td>
                          <Person person={l.employee} />
                        </td>
                      )}
                      <td>
                        <strong>{l.type}</strong>
                        <span
                          className="table-secondary reason-preview"
                          title={l.reason}
                        >
                          {l.reason}
                        </span>
                      </td>
                      <td>
                        {dateLabel(l.startDate)} –{" "}
                        {dateLabel(l.endDate, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td>{l.days}</td>
                      <td>
                        <Status value={l.status} />
                      </td>
                      <td>
                        {l.status === "pending" ? (
                          employee ? (
                            <Button
                              size="small"
                              color="inherit"
                              onClick={() => cancel(l._id)}
                              disabled={busy}
                            >
                              Cancel request
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setReview(l)}
                            >
                              Review
                            </Button>
                          )
                        ) : (
                          <>
                            <span className="table-secondary">
                              {l.comment || l.reviewedBy?.email || "No comment"}
                            </span>
                            {l.reviewedAt && (
                              <span className="table-secondary">
                                {dateLabel(l.reviewedAt)}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager total={list.data.total} page={page} setPage={setPage} />
          </>
        )}
      </Panel>
      <LeaveApply
        open={open}
        onClose={() => setOpen(false)}
        apply={apply}
        busy={busy}
        error={error}
        values={values}
        setValues={setValues}
      />
      {review && (
        <LeaveReview record={review} onClose={() => setReview(null)} />
      )}
    </>
  );
}
