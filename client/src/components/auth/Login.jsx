import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  Button,
  TextField,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Eye,
  EyeSlash,
  UsersThree,
  CalendarCheck,
  GraduationCap,
  ArrowRight,
  CheckCircle,
} from "@phosphor-icons/react";
import Brand from "../Brand";
import DashboardPreview from "./DashboardPreview";
import { api, message } from "../../api";
import { signedIn } from "../../store";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
const demoRoles = [
  {
    role: "hr",
    label: "HR",
    description: "Manage people & reports",
    icon: UsersThree,
  },
  {
    role: "manager",
    label: "Manager",
    description: "Support your team & their growth",
    icon: GraduationCap,
  },
  {
    role: "employee",
    label: "Employee",
    description: "Plan time off & track your workday",
    icon: CalendarCheck,
  },
];
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [demoEnabled, setDemoEnabled] = useState(false);
  const requestInFlight = useRef(false);
  const errorRef = useRef(null);
  const dispatch = useDispatch();
  useEffect(() => {
    document.title = "Sign in · StaffSync";
    let active = true;
    api
      .get("/config")
      .then((r) => active && setDemoEnabled(r.data.demoEnabled))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  async function signIn(e, demo) {
    e?.preventDefault();
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy(true);
    setError("");
    setSelectedRole(demo || null);
    const credentials = demo
      ? { email: `${demo}@staffsync.demo`, password: "StaffSync@2026" }
      : { email, password };
    if (demo) {
      setEmail(credentials.email);
      setPassword(credentials.password);
    }
    try {
      const { data } = await api.post("/auth/login", credentials);
      dispatch(signedIn(data));
    } catch (e) {
      setError(`${message(e)} Check your details and try again.`);
    } finally {
      requestInFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="login login-showcase">
      <a className="skip-link" href="#login-main">
        Skip to sign in
      </a>
      <aside className="login-brand">
        <Brand />
        <div className="login-story">
          <h1>
            A good day
            <br />
            starts <em>in sync.</em>
          </h1>
          <p>Leave, attendance and reviews, in one place.</p>
        </div>
        <DashboardPreview />
      </aside>
      <main className="login-form" id="login-main" tabIndex={-1}>
        <div className="login-form-inner">
          <Brand className="login-mobile-brand" />
          <div className="login-intro">
            <span className="login-eyebrow">PEOPLE, CONNECTED.</span>
            <h2>{demoEnabled ? "Try a day in StaffSync." : "Welcome back."}</h2>
            <p className="login-description">
              {demoEnabled
                ? "Pick a role. Your workspace is ready to explore."
                : "Sign in to your people workspace."}
            </p>
          </div>
          {error && (
            <Alert
              ref={errorRef}
              tabIndex={-1}
              severity="error"
              className="login-error"
            >
              {error}
            </Alert>
          )}
          {demoEnabled && (
            <section
              className="demo-section"
              aria-label="Explore the demo workspace"
            >
              <div className="demo-roles">
                {demoRoles.map(({ role, label, description, icon: Icon }) => (
                  <button
                    type="button"
                    key={role}
                    className={`demo-role-card ${selectedRole === role ? "is-selected" : ""}`}
                    aria-label={label}
                    aria-describedby={`demo-${role}-description`}
                    aria-pressed={selectedRole === role}
                    disabled={busy}
                    onClick={(e) => signIn(e, role)}
                  >
                    <span className={`demo-role-icon demo-role-icon-${role}`}>
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <span className="demo-role-copy">
                      <strong>{label}</strong>
                      <span id={`demo-${role}-description`}>{description}</span>
                    </span>
                    <span className="demo-role-action">
                      {selectedRole === role ? (
                        busy ? (
                          <CircularProgress
                            size={18}
                            color="inherit"
                            aria-hidden="true"
                          />
                        ) : (
                          <CheckCircle size={21} aria-hidden="true" />
                        )
                      ) : (
                        <ArrowRight size={20} aria-hidden="true" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <p className="demo-mode">
                <span aria-hidden="true" />
                Demo mode · no real data
              </p>
            </section>
          )}
          <div
            className="login-announcement"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {busy
              ? selectedRole
                ? `Opening the ${demoRoles.find((r) => r.role === selectedRole)?.label} workspace…`
                : "Signing in…"
              : ""}
          </div>
          {demoEnabled && (
            <div className="login-divider">
              <span>Or sign in with your account</span>
            </div>
          )}
          <form
            onSubmit={(e) => signIn(e)}
            aria-label="Sign in with your account"
            aria-busy={busy}
          >
            <div className="form-fields">
              <TextField
                id="login-email"
                name="email"
                label="Work email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedRole(null);
                }}
                required
                autoComplete="username"
                slotProps={{
                  htmlInput: {
                    spellCheck: false,
                    inputMode: "email",
                    autoCapitalize: "none",
                  },
                }}
              />
              <TextField
                id="login-password"
                name="password"
                label="Password"
                type={show ? "text" : "password"}
                fullWidth
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSelectedRole(null);
                }}
                required
                autoComplete="current-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          aria-label={show ? "Hide password" : "Show password"}
                          aria-pressed={show}
                          onClick={() => setShow(!show)}
                        >
                          {show ? (
                            <EyeSlash size={20} aria-hidden="true" />
                          ) : (
                            <Eye size={20} aria-hidden="true" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                variant="contained"
                size="large"
                fullWidth
                type="submit"
                disabled={busy}
              >
                {busy && !selectedRole ? (
                  <>
                    <CircularProgress
                      size={18}
                      color="inherit"
                      aria-hidden="true"
                    />{" "}
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </form>
          <p className="login-register">
            New to StaffSync?{" "}
            <Link to="/register">
              Create an account <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </p>
        </div>
        <p className="login-copyright">StaffSync · A little more in sync.</p>
      </main>
    </div>
  );
}
