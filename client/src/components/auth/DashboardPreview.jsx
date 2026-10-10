import { CalendarBlank, Check, TrendUp } from "@phosphor-icons/react";
import { Logomark } from "../Brand";
export default function DashboardPreview() {
  return (
    <figure
      className="login-preview"
      aria-label="Sample dashboard showing leave balance, attendance, and team members present"
    >
      <div className="preview-window" aria-hidden="true">
        <div className="preview-topbar">
          <span className="preview-wordmark">
            <Logomark size={20} /> staffsync
            <span className="preview-dot">.</span>
          </span>
          <span className="preview-topbar-label">Your people workspace</span>
          <span className="preview-avatar">AM</span>
        </div>
        <div className="preview-body">
          <div className="preview-heading">
            <div>
              <span>OVERVIEW</span>
              <h3>A little more in sync.</h3>
            </div>
            <span className="preview-date">
              <CalendarBlank size={14} /> Today
            </span>
          </div>
          <div className="preview-metrics">
            <div>
              <span>Leave balance</span>
              <strong>
                12<small>days</small>
              </strong>
              <p>Room for a little time away.</p>
              <div className="preview-leave-track">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div>
              <span>Present today</span>
              <strong>
                10<small>/ 12</small>
              </strong>
              <p>
                <span className="preview-status-dot" /> A good day, together.
              </p>
              <span className="preview-trend">
                <TrendUp size={13} /> 83% attendance
              </span>
            </div>
          </div>
          <div className="preview-lower">
            <div className="preview-attendance">
              <h4>Attendance pulse</h4>
              <span>This week</span>
              <svg viewBox="0 0 280 98" fill="none">
                <path
                  d="M0 22H280M0 53H280M0 84H280"
                  className="preview-chart-grid"
                />
                <path
                  d="M0 71C23 71 30 27 56 32S86 54 110 36 142 47 166 24 200 34 224 16 256 23 280 9V98H0Z"
                  className="preview-chart-fill"
                />
                <path
                  d="M0 71C23 71 30 27 56 32S86 54 110 36 142 47 166 24 200 34 224 16 256 23 280 9"
                  className="preview-chart-line"
                  strokeWidth="2.5"
                />
              </svg>
              <div className="preview-days">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
              </div>
            </div>
            <div className="preview-team">
              <h4>Who’s in today</h4>
              {[
                ["AM", "Aisha Mehta", "People"],
                ["AR", "Arjun Rao", "Engineering"],
                ["MS", "Maya Shah", "Design"],
              ].map(([initials, name, department]) => (
                <div className="preview-person" key={initials}>
                  <span className="preview-avatar">{initials}</span>
                  <div>
                    <strong>{name}</strong>
                    <span>{department}</span>
                  </div>
                  <Check size={13} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <figcaption>A glimpse of your workday · Sample dashboard</figcaption>
    </figure>
  );
}
