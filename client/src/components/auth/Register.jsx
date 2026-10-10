import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, TextField, MenuItem, Alert } from "@mui/material";
import Brand from "../Brand";
import CopyrightFooter from "../CopyrightFooter";
import { api, message } from "../../api";

export default function Register() {
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const change = (event) =>
    setValues((old) => ({ ...old, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/auth/register", values);
      setSuccess(true);
      setValues((old) => ({ ...old, password: "" }));
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login">
      <aside className="login-brand">
        <Brand />
        <div className="login-story">
          <span className="login-kicker">Your people workspace</span>
          <h1>Your next chapter starts here.</h1>
          <p>
            Keep your profile, time off, and learning together in one place.
          </p>
        </div>
      </aside>
      <main className="login-form">
        <div className="login-form-inner">
          <h2>Create your account</h2>
          <p className="login-description">Join your StaffSync workspace.</p>
          {success ? (
            <Alert severity="success">
              Account created. Sign in to continue.
            </Alert>
          ) : (
            <form onSubmit={submit}>
              <div className="form-fields">
                {error && <Alert severity="error">{error}</Alert>}
                <div className="form-grid">
                  {["firstName", "lastName"].map((name) => (
                    <TextField
                      key={name}
                      name={name}
                      label={name === "firstName" ? "First name" : "Last name"}
                      autoComplete={
                        name === "firstName" ? "given-name" : "family-name"
                      }
                      value={values[name]}
                      onChange={change}
                      required
                      fullWidth
                    />
                  ))}
                </div>
                <TextField
                  name="email"
                  label="Work email"
                  type="email"
                  autoComplete="username"
                  value={values.email}
                  onChange={change}
                  required
                  fullWidth
                />
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  helperText="Use at least 10 characters (maximum 72 UTF-8 bytes)."
                  value={values.password}
                  onChange={change}
                  required
                  fullWidth
                />
                <TextField
                  select
                  name="role"
                  label="Account type"
                  value={values.role}
                  onChange={change}
                  fullWidth
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                </TextField>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={busy}
                  fullWidth
                >
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </div>
            </form>
          )}
          <Button component={Link} to="/login" fullWidth>
            Back to sign in
          </Button>
        </div>
        <CopyrightFooter variant="auth" />
      </main>
    </div>
  );
}
