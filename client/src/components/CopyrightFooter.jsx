export default function CopyrightFooter({ variant = "app" }) {
  return (
    <footer
      className={`copyright-footer ${variant === "auth" ? "auth-copyright" : "app-footer"}`}
    >
      <span>© 2026 Abhigyan Dwivedi · StaffSync</span>
      <span>Demo project · Fictional data only</span>
    </footer>
  );
}
