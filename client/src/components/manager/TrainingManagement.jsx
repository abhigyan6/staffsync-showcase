import { useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Chip,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Plus,
  GraduationCap,
  Clock,
  CalendarBlank,
  PencilSimple,
  Trash,
  BookOpen,
  CheckCircle,
} from "@phosphor-icons/react";
import { useResource, useApp } from "../../hooks";
import { api, message, dateLabel, fullName } from "../../api";
import {
  PageHeading,
  Panel,
  Loading,
  Failure,
  Empty,
  Pager,
  FormDialog,
  Field,
  Confirm,
  Person,
  Status,
} from "../../components";
const defaults = {
  title: "",
  description: "",
  category: "Professional development",
  dueDate: "",
  date: "",
  trainer: "TBD",
  duration: "",
  resourceUrl: "",
  employeeIds: [],
};
export default function Training() {
  const user = useSelector((s) => s.auth.user),
    manager = user.role === "manager",
    employee = user.role === "employee";
  const { toast, refresh } = useApp();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1),
    [open, setOpen] = useState(manager && params.has("add")),
    [editing, setEditing] = useState(null),
    [values, setValues] = useState(defaults),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [remove, setRemove] = useState(null),
    [detail, setDetail] = useState(null);
  const list = useResource("/training?page=" + page);
  const directory = useResource(manager ? "/employees/directory" : "/auth/me");
  function edit(t) {
    setEditing(t || null);
    setValues(
      t
        ? {
            ...defaults,
            title: t.title,
            description: t.description,
            category: t.category,
            dueDate: t.dueDate,
            date: t.date || "",
            trainer: t.trainer || "TBD",
            duration: t.duration,
            resourceUrl: t.resourceUrl,
            employeeIds: t.assignments
              .map((a) => a.employee?._id)
              .filter(Boolean),
          }
        : defaults,
    );
    setError("");
    setOpen(true);
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api[editing ? "patch" : "post"](
        editing ? `/training/${editing._id}` : "/training",
        values,
      );
      toast(editing ? "Training updated." : "Training created and assigned.");
      setOpen(false);
      setParams({});
      refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function progress(t, status) {
    setBusy(true);
    try {
      await api.patch(`/training/${t._id}/progress`, { status });
      toast(
        status === "completed"
          ? "Training completed. Nicely done."
          : "Training started.",
      );
      refresh();
    } catch (e) {
      toast(message(e), "error");
    } finally {
      setBusy(false);
    }
  }
  async function removeItem() {
    setBusy(true);
    try {
      await api.delete(`/training/${remove._id}`);
      setRemove(null);
      toast("Training deleted.");
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
        title="Learning & growth"
        description={
          employee
            ? "Make your next step a meaningful one."
            : "Create opportunities for your people to develop."
        }
      >
        {manager && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => edit()}
          >
            Create training
          </Button>
        )}
      </PageHeading>
      {list.error ? (
        <Failure error={list.error} retry={list.refresh} />
      ) : list.loading && !list.data ? (
        <Loading />
      ) : !list.data?.items.length ? (
        <Panel title="Training programs">
          <Empty
            title={
              employee
                ? "Your next opportunity is on its way"
                : "No training programs yet"
            }
            description={
              employee
                ? "Assigned programs will appear here."
                : "Create a program and assign it to your team."
            }
          />
        </Panel>
      ) : (
        <div className="training-grid">
          {list.data.items.map((t, i) => {
            const completed = t.assignments.filter(
                (a) => a.status === "completed",
              ).length,
              total = t.assignments.length,
              mine = t.assignments[0]?.status;
            return (
              <article className="training-card" key={t._id}>
                <div className="training-card-top">
                  <span className={`training-symbol training-symbol-${i % 3}`}>
                    <GraduationCap size={29} />
                  </span>
                  <span className="category-label">{t.category}</span>
                  {manager && (
                    <div className="training-actions">
                      <Tooltip title="Edit training">
                        <IconButton
                          aria-label={`Edit ${t.title}`}
                          onClick={() => edit(t)}
                        >
                          <PencilSimple size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete training">
                        <IconButton
                          aria-label={`Delete ${t.title}`}
                          onClick={() => setRemove(t)}
                        >
                          <Trash size={18} />
                        </IconButton>
                      </Tooltip>
                    </div>
                  )}
                </div>
                <h2>{t.title}</h2>
                <p>{t.description}</p>
                <div className="training-meta">
                  <span>
                    <Clock size={16} />
                    {t.duration}
                  </span>
                  <span>
                    <CalendarBlank size={16} />
                    Due {dateLabel(t.dueDate)}
                  </span>
                </div>
                <p className="muted">
                  Trainer: {t.trainer || "TBD"}
                  {t.date ? ` · Scheduled ${dateLabel(t.date)}` : ""}
                </p>
                {employee ? (
                  <div className="training-progress">
                    <Status value={mine || "assigned"} />
                  </div>
                ) : (
                  <div className="training-progress">
                    <div>
                      <span>Team progress</span>
                      <strong>
                        {completed}/{total} completed
                      </strong>
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={total ? (completed / total) * 100 : 0}
                    />
                  </div>
                )}
                <div className="training-card-footer">
                  {employee ? (
                    <>
                      {t.resourceUrl && (
                        <Button
                          variant="outlined"
                          component="a"
                          href={t.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<BookOpen size={17} />}
                        >
                          Open resource
                        </Button>
                      )}
                      <Button
                        variant={
                          mine === "completed" ? "outlined" : "contained"
                        }
                        disabled={busy || mine === "completed"}
                        onClick={() =>
                          progress(
                            t,
                            mine === "assigned" ? "in-progress" : "completed",
                          )
                        }
                      >
                        {mine === "completed"
                          ? "Completed"
                          : mine === "assigned"
                            ? "Start learning"
                            : "Mark complete"}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outlined" onClick={() => setDetail(t)}>
                      View assignments
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {list.data && (
        <Pager total={list.data.total} page={page} setPage={setPage} />
      )}
      <FormDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setParams({});
        }}
        title={editing ? "Edit training program" : "Create a training program"}
        subtitle="Give your team a clear path to something new."
        onSubmit={save}
        busy={busy}
        error={error}
        submitLabel={editing ? "Save changes" : "Create & assign"}
      >
        <Field
          name="title"
          label="Program title"
          values={values}
          setValues={setValues}
        />
        <Field
          name="description"
          label="Description"
          multiline
          rows={3}
          values={values}
          setValues={setValues}
        />
        <Field
          name="category"
          label="Category"
          values={values}
          setValues={setValues}
        />
        <Field
          name="trainer"
          label="Trainer"
          values={values}
          setValues={setValues}
        />
        <Field
          name="date"
          label="Training date"
          type="date"
          required={false}
          slotProps={{ inputLabel: { shrink: true } }}
          values={values}
          setValues={setValues}
        />
        <div className="form-grid">
          <Field
            name="dueDate"
            label="Due date"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            values={values}
            setValues={setValues}
          />
          <Field
            name="duration"
            label="Duration, e.g. 2 hours"
            values={values}
            setValues={setValues}
          />
        </div>
        <Field
          name="resourceUrl"
          label="Resource URL (optional)"
          type="url"
          required={false}
          values={values}
          setValues={setValues}
        />
        <div className="assignment-select">
          <strong>Assign to team members</strong>
          {directory.data?.items?.length ? (
            directory.data.items.map((e) => (
              <FormControlLabel
                key={e._id}
                control={
                  <Checkbox
                    checked={values.employeeIds.includes(e._id)}
                    onChange={(event) =>
                      setValues((v) => ({
                        ...v,
                        employeeIds: event.target.checked
                          ? [...v.employeeIds, e._id]
                          : v.employeeIds.filter((id) => id !== e._id),
                      }))
                    }
                  />
                }
                label={fullName(e)}
              />
            ))
          ) : (
            <p>No active team members available.</p>
          )}
        </div>
      </FormDialog>
      <Confirm
        open={!!remove}
        onClose={() => setRemove(null)}
        onConfirm={removeItem}
        title="Delete this program?"
        description="The program and its assignment progress will be removed."
        busy={busy}
      />
      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{detail?.title}</DialogTitle>
        <DialogContent>
          <div className="assignment-list">
            {detail?.assignments.map((a) => (
              <div key={a._id}>
                <Person person={a.employee} />
                <Status value={a.status} />
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
