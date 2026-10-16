import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Alert, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Sun, Moon, LockKey, ShieldCheck } from "@phosphor-icons/react";
import { useApp } from "../hooks";
import { api, message } from "../api";
import { signedOut } from "../store";
import { PageHeading, Panel, Field } from "../components";
export default function Settings() {
  const user = useSelector((s) => s.auth.user),
    dispatch = useDispatch();
  const { mode, setMode, toast } = useApp();
  const [values, setValues] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function change(e) {
    e.preventDefault();
    if (values.newPassword !== values.confirmPassword) {
      setError("Your new passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post("/auth/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast("Password changed. Sign in with your new password.");
      dispatch(signedOut());
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Settings"
        description="Make your workspace comfortable and keep your account secure."
      />
      <div className="settings-layout">
        <Panel
          title="Appearance"
          description="Choose the theme that works best for you."
        >
          <div className="settings-section">
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, value) => value && setMode(value)}
            >
              <ToggleButton value="light">
                <Sun size={20} />
                Light
              </ToggleButton>
              <ToggleButton value="dark">
                <Moon size={20} />
                Dark
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </Panel>
        <Panel
          title="Account security"
          description="Change your password regularly and keep it private."
        >
          <form onSubmit={change} className="settings-section">
            <div className="form-fields">
              {error && <Alert severity="error">{error}</Alert>}
              <Field
                name="currentPassword"
                label="Current password"
                type="password"
                autoComplete="current-password"
                values={values}
                setValues={setValues}
              />
              <Field
                name="newPassword"
                label="New password"
                type="password"
                autoComplete="new-password"
                inputProps={{ minLength: 10, maxLength: 128 }}
                helperText="Use at least 10 characters."
                values={values}
                setValues={setValues}
              />
              <Field
                name="confirmPassword"
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                inputProps={{ minLength: 10 }}
                values={values}
                setValues={setValues}
              />
              <Alert severity="info">
                Changing your password signs you out of all sessions.
              </Alert>
              <div>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<LockKey size={18} />}
                  disabled={busy}
                >
                  {busy ? "Updating…" : "Change password"}
                </Button>
              </div>
            </div>
          </form>
        </Panel>
        <Panel
          title="Your access"
          description="Permissions are assigned by your HR team."
        >
          <div className="access-summary">
            <ShieldCheck size={32} />
            <div>
              <strong>
                {user.role === "hr"
                  ? "HR administrator"
                  : user.role === "manager"
                    ? "Team manager"
                    : "Employee"}
              </strong>
              <p>{user.email}</p>
              <span>Your working timezone is India Standard Time (IST).</span>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
