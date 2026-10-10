export function Logomark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M29 8H17a9 9 0 0 0 0 18h6"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M11 32h12a9 9 0 0 0 0-18h-6"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        opacity=".64"
      />
    </svg>
  );
}
export default function Brand({ className = "", size = 32 }) {
  return (
    <div className={`brand ${className}`} aria-label="StaffSync" translate="no">
      <Logomark size={size} />
      <span>
        staffsync<span className="brand-period">.</span>
      </span>
    </div>
  );
}
