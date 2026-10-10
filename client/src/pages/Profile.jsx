import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Button, Alert, Divider } from "@mui/material";
import {
  Camera,
  FloppyDisk,
  Star,
  EnvelopeSimple,
  MapPin,
} from "@phosphor-icons/react";
import { useResource, useApp } from "../hooks";
import { api, message, dateLabel, fullName } from "../api";
import { loadSession } from "../store";
import {
  PageHeading,
  Panel,
  Avatar,
  Status,
  Loading,
  Failure,
  Field,
} from "../components";
export default function Profile() {
  const dispatch = useDispatch(),
    { toast, refresh } = useApp();
  const resource = useResource("/auth/me");
  const [values, setValues] = useState({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (resource.data?.employee) {
      const e = resource.data.employee;
      setValues({
        firstName: e.firstName,
        lastName: e.lastName,
        phone: e.phone || "",
        location: e.location || "",
        address: e.address || "",
        bio: e.bio || "",
      });
    }
  }, [resource.data]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch("/profile", values);
      await dispatch(loadSession());
      toast("Profile updated.");
      refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post("/profile/avatar", form);
      await dispatch(loadSession());
      toast("Profile photo updated.");
      refresh();
    } catch (e) {
      toast(message(e), "error");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }
  if (resource.loading && !resource.data) return <Loading />;
  if (resource.error)
    return <Failure error={resource.error} retry={resource.refresh} />;
  const employee = resource.data?.employee;
  if (!employee) return null;
  return (
    <>
      <PageHeading
        title="My profile"
        description="Keep your personal details accurate and up to date."
      />
      <div className="profile-layout">
        <Panel title="Your details" className="profile-summary">
          <Avatar person={employee} size={96} />
          <h2>{fullName(employee)}</h2>
          <p>{employee.jobTitle}</p>
          <Status value={employee.status} />
          <Button
            component="label"
            variant="outlined"
            startIcon={<Camera size={18} />}
            disabled={busy}
          >
            Update photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={upload}
            />
          </Button>
          <small>JPEG, PNG, or WebP. Maximum 3 MB.</small>
          <div className="profile-facts">
            {[
              ["Employee ID", employee.employeeId],
              ["Department", employee.department],
              ["Work email", employee.email],
              [
                "Monthly salary (INR)",
                employee.salary == null
                  ? "Not set"
                  : new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(employee.salary),
              ],
              [
                "Joined",
                dateLabel(employee.joiningDate, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </Panel>
        <div>
          <Panel
            title="Personal information"
            description="Employment details are managed by your HR team."
          >
            <form onSubmit={save} className="profile-form">
              <div className="form-fields">
                {error && <Alert severity="error">{error}</Alert>}
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
                <div className="form-grid">
                  <Field
                    name="phone"
                    label="Phone number"
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
                  name="address"
                  label="Address"
                  required={false}
                  multiline
                  rows={2}
                  values={values}
                  setValues={setValues}
                />
                <Field
                  name="bio"
                  label="About me"
                  required={false}
                  multiline
                  rows={4}
                  inputProps={{ maxLength: 1000 }}
                  values={values}
                  setValues={setValues}
                />
                <div className="form-save">
                  <Button
                    variant="contained"
                    type="submit"
                    startIcon={<FloppyDisk size={18} />}
                    disabled={busy}
                  >
                    {busy ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Panel>
          {employee.performance?.rating && (
            <Panel
              title="Your latest performance review"
              className="performance-panel"
            >
              <div className="performance-rating">
                <Star size={24} weight="fill" />
                <strong>{employee.performance.rating} / 5</strong>
                <span>{dateLabel(employee.performance.reviewedAt)}</span>
              </div>
              <p>{employee.performance.note}</p>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
