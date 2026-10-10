import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  IconButton,
  Tooltip,
  Drawer,
  Chip,
  Divider,
  Alert,
} from "@mui/material";
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Trash,
  UsersThree,
  X,
  EnvelopeSimple,
  Phone,
  MapPin,
  Star,
  CalendarBlank,
} from "@phosphor-icons/react";
import { api, message, fullName, dateLabel } from "../../api";
import { useApp, useResource } from "../../hooks";
import {
  PageHeading,
  Panel,
  Person,
  Status,
  Avatar,
  Loading,
  Failure,
  Empty,
  Pager,
  Field,
  FormDialog,
  Confirm,
} from "../../components";
const defaults = {
  firstName: "",
  lastName: "",
  email: "",
  employeeId: "",
  department: "",
  jobTitle: "",
  manager: "",
  phone: "",
  location: "",
  address: "",
  salary: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  role: "employee",
  password: "",
};
export default function Employees() {
  const user = useSelector((s) => s.auth.user),
    isHR = user.role === "hr";
  const { toast, refresh } = useApp();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState(""),
    [department, setDepartment] = useState(""),
    [page, setPage] = useState(1),
    [status, setStatus] = useState("active");
  const [open, setOpen] = useState(params.has("add")),
    [editing, setEditing] = useState(null),
    [values, setValues] = useState(defaults),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [remove, setRemove] = useState(null),
    [detail, setDetail] = useState(null),
    [performance, setPerformance] = useState(null),
    [rating, setRating] = useState({ rating: "4", note: "" });
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const q = new URLSearchParams({
    search: debounced,
    department,
    page: String(page),
    status,
  });
  const list = useResource("/employees?" + q);
  const directory = useResource("/employees/directory");
  function edit(e) {
    setEditing(e || null);
    setValues(
      e
        ? {
            ...defaults,
            ...e,
            manager: e.manager?._id || e.manager || "",
            role: e.user?.role || "employee",
          }
        : defaults,
    );
    setError("");
    setOpen(true);
  }
  function close() {
    setOpen(false);
    setParams({});
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = Object.fromEntries(
        Object.entries(values).filter(([key]) =>
          Object.keys(defaults).includes(key),
        ),
      );
      payload.salary =
        payload.salary === "" || payload.salary == null
          ? null
          : Number(payload.salary);
      if (editing) {
        delete payload.password;
        delete payload.role;
        await api.patch(`/employees/${editing._id}`, payload);
      } else await api.post("/employees", payload);
      toast(editing ? "Employee updated." : "Employee added.");
      refresh();
      close();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function removeEmployee() {
    setBusy(true);
    try {
      await api.delete(`/employees/${remove._id}`);
      toast("Employee removed. Historical records retained.");
      setRemove(null);
      refresh();
    } catch (e) {
      toast(message(e), "error");
    } finally {
      setBusy(false);
    }
  }
  async function saveReview(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch(`/employees/${performance._id}/performance`, {
        rating: Number(rating.rating),
        note: rating.note,
      });
      toast("Performance review saved.");
      setPerformance(null);
      refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title={isHR ? "Your people" : "Your team"}
        description={
          isHR
            ? "The people behind the work. Keep their details up to date."
            : "Support your team and keep their growth moving."
        }
      >
        {isHR && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => edit()}
          >
            Add employee
          </Button>
        )}
      </PageHeading>
      <Panel
        title={isHR ? "Employee directory" : "Team directory"}
        description={`${list.data?.total || 0} ${status === "active" ? "active" : "removed"} team members`}
      >
        <div className="toolbar">
          <TextField
            label="Search people"
            placeholder="Search name, email, or employee ID"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="directory-search"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MagnifyingGlass size={19} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            label="Department"
            size="small"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="directory-filter"
            sx={{ minWidth: 175 }}
          >
            <MenuItem value="">All departments</MenuItem>
            {directory.data?.departments.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
          {isHR && (
            <TextField
              select
              label="Status"
              size="small"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="directory-filter"
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Removed</MenuItem>
            </TextField>
          )}
        </div>
        {list.error ? (
          <Failure error={list.error} retry={list.refresh} />
        ) : list.loading && !list.data ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <Empty
            title="No matching people"
            description="Try another search or department."
            action={
              <Button
                onClick={() => {
                  setSearch("");
                  setDepartment("");
                  setStatus("active");
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table
                className="data-table employee-table"
                aria-label={isHR ? "Employee directory" : "Team directory"}
              >
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((e) => (
                    <tr key={e._id}>
                      <td className="employee-identity">
                        <button
                          className="person-button"
                          onClick={() => setDetail(e)}
                        >
                          <Person person={e} secondary={e.email} />
                        </button>
                      </td>
                      <td data-label="Department">
                        <strong>{e.department}</strong>
                        <span className="table-secondary">{e.jobTitle}</span>
                      </td>
                      <td data-label="Role">
                        <span className="role-label">
                          {e.user?.role === "hr" ? "HR" : e.user?.role}
                        </span>
                      </td>
                      <td data-label="Joined">
                        {dateLabel(e.joiningDate, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td data-label="Status">
                        <Status value={e.status} />
                      </td>
                      <td
                        className="right employee-actions"
                        data-label="Actions"
                      >
                        {isHR ? (
                          <>
                            <Tooltip title="Edit employee">
                              <IconButton
                                size="small"
                                aria-label={`Edit ${fullName(e)}`}
                                onClick={() => edit(e)}
                              >
                                <PencilSimple size={19} />
                              </IconButton>
                            </Tooltip>
                            {status === "active" && (
                              <Tooltip title="Remove employee">
                                <IconButton
                                  size="small"
                                  aria-label={`Remove ${fullName(e)}`}
                                  onClick={() => setRemove(e)}
                                >
                                  <Trash size={19} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <Button
                            size="small"
                            startIcon={<Star size={17} />}
                            onClick={() => {
                              setPerformance(e);
                              setRating({
                                rating: String(e.performance?.rating || 4),
                                note: e.performance?.note || "",
                              });
                              setError("");
                            }}
                          >
                            Review
                          </Button>
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
      <FormDialog
        open={open && isHR}
        onClose={close}
        title={editing ? "Edit employee" : "Add a new teammate"}
        subtitle="Keep employment information accurate and easy to find."
        onSubmit={save}
        busy={busy}
        error={error}
        submitLabel={editing ? "Save changes" : "Add employee"}
      >
        <div className="form-grid">
          <Field
            name="firstName"
            label="First name"
            values={values}
            setValues={setValues}
          />
          <Field
            name="lastName"
            label="Last name"
            values={values}
            setValues={setValues}
          />
        </div>
        <Field
          name="email"
          label="Work email"
          type="email"
          values={values}
          setValues={setValues}
        />
        <div className="form-grid">
          <Field
            name="employeeId"
            label="Employee ID"
            values={values}
            setValues={setValues}
          />
          <Field
            name="department"
            label="Department"
            values={values}
            setValues={setValues}
          />
        </div>
        <Field
          name="jobTitle"
          label="Job title"
          values={values}
          setValues={setValues}
        />
        <div className="form-grid">
          <Field
            name="joiningDate"
            label="Joining date"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            values={values}
            setValues={setValues}
          />
          <Field
            name="manager"
            label="Reporting manager"
            required={false}
            options={[
              { value: "", label: "No manager" },
              ...(directory.data?.managers || []).map((m) => ({
                value: m.user,
                label: fullName(m),
              })),
            ]}
            values={values}
            setValues={setValues}
          />
        </div>
        <div className="form-grid">
          <Field
            name="phone"
            label="Phone"
            required={false}
            values={values}
            setValues={setValues}
          />
          <Field
            name="location"
            label="Location"
            required={false}
            values={values}
            setValues={setValues}
          />
        </div>
        <Field
          name="salary"
          label="Monthly salary (INR)"
          type="number"
          required={false}
          inputProps={{ min: 0, step: "0.01" }}
          values={values}
          setValues={setValues}
          helperText="Visible only to HR and this employee."
        />
        <Field
          name="address"
          label="Address"
          required={false}
          multiline
          rows={2}
          values={values}
          setValues={setValues}
        />
        {!editing && (
          <>
            <Divider />
            <Field
              name="role"
              label="Account role"
              options={[
                { value: "employee", label: "Employee" },
                { value: "manager", label: "Manager" },
                { value: "hr", label: "HR" },
              ]}
              values={values}
              setValues={setValues}
            />
            <Field
              name="password"
              label="Initial password"
              type="password"
              helperText="At least 10 characters. Share securely with the employee."
              inputProps={{ minLength: 10 }}
              values={values}
              setValues={setValues}
            />
          </>
        )}
      </FormDialog>
      <Confirm
        open={!!remove}
        onClose={() => setRemove(null)}
        onConfirm={removeEmployee}
        title={`Remove ${remove?.firstName || "employee"}?`}
        description="Their account will lose access and they will leave the active directory. Attendance and leave history will be retained."
        busy={busy}
      />
      <Drawer
        anchor="right"
        open={!!detail}
        onClose={() => setDetail(null)}
        PaperProps={{ className: "detail-drawer" }}
      >
        {detail && (
          <>
            <div className="drawer-heading">
              <h2>Employee profile</h2>
              <IconButton
                aria-label="Close profile"
                onClick={() => setDetail(null)}
              >
                <X size={22} />
              </IconButton>
            </div>
            <div className="employee-detail">
              <Avatar person={detail} size={88} />
              <h2>{fullName(detail)}</h2>
              <p>{detail.jobTitle}</p>
              <Status value={detail.status} />
              <div className="detail-fields">
                {[
                  ["Employee ID", detail.employeeId],
                  ["Department", detail.department],
                  ["Work email", detail.email],
                  ["Location", detail.location || "Not set"],
                  ...(isHR
                    ? [
                        ["Address", detail.address || "Not set"],
                        [
                          "Monthly salary (INR)",
                          detail.salary == null
                            ? "Not set"
                            : new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                              }).format(detail.salary),
                        ],
                      ]
                    : []),
                  ["Phone", detail.phone || "Not set"],
                  [
                    "Joined",
                    dateLabel(detail.joiningDate, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  ],
                ].map(([l, v]) => (
                  <div key={l}>
                    <span>{l}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
              {detail.bio && <p>{detail.bio}</p>}
              {detail.performance?.rating && (
                <div className="performance-summary">
                  <Star size={20} weight="fill" />
                  <strong>{detail.performance.rating}/5</strong>
                  <p>{detail.performance.note}</p>
                </div>
              )}
            </div>
          </>
        )}
      </Drawer>
      <FormDialog
        open={!!performance}
        onClose={() => setPerformance(null)}
        title={`Review ${performance?.firstName || "employee"}’s performance`}
        onSubmit={saveReview}
        busy={busy}
        error={error}
      >
        <Field
          name="rating"
          label="Rating"
          options={[1, 2, 3, 4, 5].map((n) => ({
            value: String(n),
            label: `${n} / 5`,
          }))}
          values={rating}
          setValues={setRating}
        />
        <Field
          name="note"
          label="Feedback and next steps"
          multiline
          rows={4}
          values={rating}
          setValues={setRating}
        />
      </FormDialog>
    </>
  );
}
