import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Skeleton,
  Alert,
  Pagination,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Tray, X, Check } from "@phosphor-icons/react";
import { fullName, dateLabel, api, message } from "./api";
import { useApp } from "./hooks";
export function Icon({ as: Component, size = 20, ...props }) {
  return <Component size={size} weight="regular" {...props} />;
}
export function Avatar({ person, size = 38 }) {
  const name = fullName(person);
  let hash = 0;
  for (const c of name) hash += c.charCodeAt(0);
  return (
    <span
      className={`avatar avatar-${hash % 6}`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {person?.avatar ? (
        <img src={person.avatar} alt={name} />
      ) : person ? (
        `${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}`
      ) : (
        "SS"
      )}
    </span>
  );
}
export function Person({ person, secondary }) {
  return (
    <div className="person">
      <Avatar person={person} />
      <div>
        <strong>{fullName(person)}</strong>
        <span>{secondary || person?.jobTitle || person?.department}</span>
      </div>
    </div>
  );
}
export function Status({ value }) {
  const labels = {
    "in-progress": "In progress",
    assigned: "Assigned",
    present: "Present",
    late: "Late",
    "half-day": "Half day",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
    completed: "Completed",
    active: "Active",
    inactive: "Inactive",
    absent: "Absent",
    leave: "On leave",
  };
  return (
    <Chip
      size="small"
      label={labels[value] || value}
      className={`status status-${value}`}
    />
  );
}
export function PageHeading({ title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Empty({ title = "Nothing here yet", description, action }) {
  return (
    <div className="empty">
      <Tray size={36} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading-grid" role="status" aria-label="Loading content">
      <Skeleton variant="rounded" height={84} />
      <Skeleton variant="rounded" height={160} />
      <Skeleton variant="rounded" height={280} />
    </div>
  );
}
export function Failure({ error, retry }) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" onClick={retry}>
          Retry
        </Button>
      }
    >
      {error}
    </Alert>
  );
}
export function Pager({ total, page, setPage, limit = 12 }) {
  if (!total) return null;
  return (
    <div className="pager">
      <span>
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
        {total}
      </span>
      <Pagination
        count={Math.ceil(total / limit)}
        page={page}
        onChange={(_, p) => setPage(p)}
        size="small"
        shape="rounded"
      />
    </div>
  );
}
export function Field({
  name,
  label,
  values,
  setValues,
  options,
  required = true,
  ...props
}) {
  return (
    <TextField
      fullWidth
      size="small"
      name={name}
      label={label}
      required={required}
      value={values[name] ?? ""}
      onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
      select={!!options}
      {...props}
    >
      {options?.map((o) => (
        <MenuItem
          key={typeof o === "string" ? o : o.value}
          value={typeof o === "string" ? o : o.value}
        >
          {typeof o === "string" ? o : o.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
export function FormDialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  busy,
  error,
  submitLabel = "Save changes",
  wide = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth={wide ? "md" : "sm"}
    >
      <form onSubmit={onSubmit}>
        <DialogTitle>
          <div className="dialog-title">
            {title}
            <IconButton
              aria-label="Close dialog"
              onClick={onClose}
              disabled={busy}
            >
              <X size={20} />
            </IconButton>
          </div>
          {subtitle && <p className="dialog-subtitle">{subtitle}</p>}
        </DialogTitle>
        <DialogContent>
          <div className="form-fields">
            {error && <Alert severity="error">{error}</Alert>}
            {children}
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={busy}
            startIcon={
              busy ? <CircularProgress size={16} color="inherit" /> : undefined
            }
          >
            {busy ? "Saving…" : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  description,
  busy,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <p>{description}</p>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Removing…" : "Remove"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export function LeaveReview({ record, onClose }) {
  const [comment, setComment] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const { toast, refresh } = useApp();
  async function review(status) {
    setBusy(true);
    try {
      await api.patch(`/leaves/${record._id}/review`, { status, comment });
      toast(`Leave request ${status}.`);
      refresh();
      onClose();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={!!record}
      onClose={busy ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <div className="dialog-title">
          Review leave request
          <IconButton onClick={onClose} aria-label="Close">
            <X size={20} />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>
        {record && (
          <>
            <Person person={record.employee} />
            <div className="review-summary">
              <span>{record.type} leave</span>
              <strong>
                {dateLabel(record.startDate)} – {dateLabel(record.endDate)}
              </strong>
              <span>
                {record.days} calendar day{record.days !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="reason">{record.reason}</p>
            <TextField
              label="Review comment (optional)"
              fullWidth
              multiline
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              inputProps={{ maxLength: 1000 }}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          color="error"
          onClick={() => review("rejected")}
          disabled={busy}
        >
          Reject request
        </Button>
        <Button
          variant="contained"
          startIcon={<Check size={18} />}
          onClick={() => review("approved")}
          disabled={busy}
        >
          Approve request
        </Button>
      </DialogActions>
    </Dialog>
  );
}
