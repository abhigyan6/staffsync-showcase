import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Chip, Tooltip } from "@mui/material";
import {
  UsersThree,
  CalendarCheck,
  CalendarBlank,
  Clock,
  Plus,
  DownloadSimple,
  CheckCircle,
  Megaphone,
  GraduationCap,
  ArrowUpRight,
  TrendUp,
  ArrowRight,
  SunHorizon,
} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useResource, useApp } from "../../hooks";
import { api, message, dateLabel, fullName, downloadCsv } from "../../api";
import {
  PageHeading,
  Panel,
  Avatar,
  Person,
  Status,
  Loading,
  Failure,
  Empty,
  LeaveReview,
} from "../../components";
const colors = ["#126a5a", "#559d8b", "#92c3b3", "#c3ddd3", "#dfebe6"];
export default function Dashboard() {
  const user = useSelector((s) => s.auth.user),
    navigate = useNavigate(),
    { toast, refresh, mode } = useApp();
  const { data, loading, error, refresh: reload } = useResource("/dashboard");
  const [review, setReview] = useState(null),
    [busy, setBusy] = useState(false);
  if (loading && !data) return <Loading />;
  if (error) return <Failure error={error} retry={reload} />;
  if (!data) return null;
  const employee = user.role === "employee";
  const todayAttendance = data.attendance.find(
    (a) => a.employee?._id === user.employee?._id,
  );
  const metric = employee
    ? [
        [
          "My attendance",
          data.stats.monthlyAttendance,
          "days recorded this month",
          CalendarCheck,
        ],
        ["Pending requests", data.stats.pending, "awaiting a decision", Clock],
        [
          "Assigned programs",
          data.trainingCount,
          "opportunities to grow",
          GraduationCap,
        ],
        [
          "On leave today",
          data.stats.onLeave ? "Yes" : "No",
          "your current leave status",
          CalendarBlank,
        ],
      ]
    : [
        [
          "Team members",
          data.stats.employees,
          `${data.stats.departments} departments`,
          UsersThree,
        ],
        [
          "Present today",
          data.stats.present,
          `${data.stats.employees ? Math.round((data.stats.present / data.stats.employees) * 100) : 0}% of your ${user.role === "hr" ? "organization" : "team"}`,
          CalendarCheck,
        ],
        [
          "On leave today",
          data.stats.onLeave,
          "approved time away",
          CalendarBlank,
        ],
        [
          "Pending requests",
          data.stats.pending,
          "ready for your review",
          Clock,
        ],
      ];
  async function mark() {
    setBusy(true);
    try {
      await api.post(
        todayAttendance ? "/attendance/check-out" : "/attendance/check-in",
      );
      toast(
        todayAttendance
          ? "Checked out. Have a good evening."
          : "Checked in. Have a good day.",
      );
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
        title={
          employee
            ? `Hello, ${user.employee.firstName}`
            : user.role === "manager"
              ? "Your team, at a glance"
              : "People overview"
        }
        description={
          employee
            ? "Your day, your updates, and what comes next."
            : "A clear view of your people and the day ahead."
        }
      >
        <span className="date-chip">
          <CalendarBlank size={18} />
          {dateLabel(data.today, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        {user.role === "hr" ? (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => navigate("/employees?add=1")}
          >
            Add employee
          </Button>
        ) : employee ? (
          <Button
            variant="contained"
            disabled={busy || !!todayAttendance?.checkOut}
            startIcon={<CalendarCheck size={18} />}
            onClick={mark}
          >
            {todayAttendance?.checkOut
              ? "Day complete"
              : todayAttendance
                ? "Check out"
                : "Check in"}
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => navigate("/training?add=1")}
          >
            Create training
          </Button>
        )}
      </PageHeading>
      <div className="metrics">
        {metric.map(([label, value, detail, Icon], i) => (
          <div className="metric" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <Icon size={21} />
            </div>
            <div className="metric-value">
              {value}
              {i === 3 && !employee && data.stats.pending > 0 && (
                <span className="metric-pill">Needs review</span>
              )}
            </div>
            <p>{detail}</p>
          </div>
        ))}
      </div>
      {!employee && data.stats.pending > 0 ? (
        <div className="attention-strip">
          <div className="attention-icon">
            <Clock size={25} />
          </div>
          <div>
            <strong>A little attention goes a long way.</strong>
            <p>
              {data.stats.pending} leave requests are waiting for your decision.
            </p>
          </div>
          <Button
            variant="contained"
            onClick={() => navigate("/leaves?status=pending")}
          >
            Review requests
          </Button>
        </div>
      ) : employee ? (
        <div className="attention-strip">
          <div className="attention-icon">
            <SunHorizon size={26} />
          </div>
          <div>
            <strong>
              {todayAttendance?.checkOut
                ? "Your workday is wrapped up."
                : todayAttendance
                  ? "You’re checked in. Make today count."
                  : "Ready when you are."}
            </strong>
            <p>
              {todayAttendance?.checkIn
                ? `Checked in at ${new Date(todayAttendance.checkIn).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}.`
                : "Mark your attendance to start your workday."}
            </p>
          </div>
          <Button variant="outlined" onClick={() => navigate("/attendance")}>
            View attendance
          </Button>
        </div>
      ) : null}
      <div className="dashboard-grid">
        <Panel
          title={employee ? "Your attendance" : "Attendance pulse"}
          description="Recorded attendance over the last seven days"
          action={
            <span className="chart-legend">
              <i />
              Present
            </span>
          }
          className="attendance-panel"
        >
          <div className="chart-summary">
            <strong>
              {data.stats.present}
              <span> / {data.stats.employees}</span>
            </strong>
            <span>
              {employee ? "attendance recorded today" : "people recorded today"}
            </span>
          </div>
          <div className="area-chart">
            <ResponsiveContainer width="100%" height={205}>
              <AreaChart
                data={data.trend}
                margin={{ top: 10, right: 12, bottom: 0, left: -25 }}
              >
                <defs>
                  <linearGradient
                    id="attendanceFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#318872" stopOpacity={0.23} />
                    <stop
                      offset="100%"
                      stopColor="#318872"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={mode === "dark" ? "#2b3a35" : "#eef2f0"}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  domain={[0, "dataMax + 1"]}
                />
                <ChartTooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e0e9e4",
                    background: mode === "dark" ? "#1a2422" : "#fff",
                  }}
                />
                <Area
                  isAnimationActive={false}
                  dataKey="present"
                  name="Present"
                  type="monotone"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#attendanceFill)"
                  dot={{
                    r: 3,
                    fill: "var(--accent)",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel
          title={employee ? "Your workplace" : "Team composition"}
          description={
            employee
              ? "Your place in the organization"
              : "People across departments"
          }
          action={<UsersThree size={21} color="#77938a" />}
          className="composition-panel"
        >
          {employee ? (
            <div className="workplace-summary">
              <Avatar person={user.employee} size={72} />
              <h3>{fullName(user.employee)}</h3>
              <p>{user.employee.jobTitle}</p>
              <div>
                <span>Department</span>
                <strong>{user.employee.department}</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{user.employee.location || "Not set"}</strong>
              </div>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/profile")}
              >
                View my profile
              </Button>
            </div>
          ) : (
            <>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={data.departments}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={73}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {data.departments.map((d, i) => (
                        <Cell key={d.name} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-label">
                  <strong>{data.stats.employees}</strong>
                  <span>people</span>
                </div>
              </div>
              <div className="department-legend">
                {data.departments.map((d, i) => (
                  <div key={d.name}>
                    <span>
                      <i style={{ background: colors[i % colors.length] }} />
                      {d.name}
                    </span>
                    <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
      <div className="dashboard-grid lower-grid">
        <Panel
          title={employee ? "My leave requests" : "Leave requests"}
          description={
            employee
              ? "Keep track of your upcoming time off"
              : "Give your team clarity on their time away"
          }
          action={
            <Button size="small" onClick={() => navigate("/leaves")}>
              View all
            </Button>
          }
        >
          {data.pending.length ? (
            <div className="table-wrap">
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>{employee ? "Leave type" : "Employee"}</th>
                    <th>Dates</th>
                    <th>Duration</th>
                    <th>{employee ? "Status" : "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pending.map((l) => (
                    <tr key={l._id}>
                      <td>
                        {employee ? (
                          <strong>{l.type} leave</strong>
                        ) : (
                          <Person person={l.employee} />
                        )}
                      </td>
                      <td>
                        <strong>
                          {dateLabel(l.startDate)} – {dateLabel(l.endDate)}
                        </strong>
                        <span className="table-secondary">{l.type} leave</span>
                      </td>
                      <td>
                        {l.days} day{l.days !== 1 ? "s" : ""}
                      </td>
                      <td>
                        {employee ? (
                          <Status value={l.status} />
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setReview(l)}
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
          ) : (
            <Empty
              title="No pending requests"
              description={
                employee
                  ? "Your leave decisions appear in Time off."
                  : "Your leave queue is up to date."
              }
            />
          )}
        </Panel>
        <Panel
          title="The noticeboard"
          description="News and updates from your workplace"
          action={
            <Button size="small" onClick={() => navigate("/announcements")}>
              View all
            </Button>
          }
        >
          {data.announcements.length ? (
            <div className="notice-list">
              {data.announcements.map((a, i) => (
                <button
                  key={a._id}
                  className="notice-item"
                  onClick={() => navigate("/announcements")}
                >
                  <span className={`notice-icon notice-${i}`}>
                    <Megaphone size={20} />
                  </span>
                  <div>
                    <span className="notice-meta">
                      {a.category} · {dateLabel(a.createdAt)}
                    </span>
                    <strong>{a.title}</strong>
                    <p>{a.content}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Empty title="No announcements yet" />
          )}
        </Panel>
      </div>
      {user.role === "hr" && (
        <Panel
          title="Recent activity"
          description="A record of important changes in your workspace"
          className="activity-panel"
        >
          <div className="activity-list">
            {data.activity.map((a) => (
              <div key={a._id}>
                <span className="activity-mark">
                  <CheckCircle size={19} />
                </span>
                <div>
                  <strong>{a.action}</strong>
                  <span>
                    {a.detail || a.actor?.email || "Workspace update"}
                  </span>
                </div>
                <time>
                  {dateLabel(a.createdAt, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {review && (
        <LeaveReview record={review} onClose={() => setReview(null)} />
      )}
    </>
  );
}
