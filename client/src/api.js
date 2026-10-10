import axios from "axios";
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 20000,
});
export const message = (e) =>
  e?.response?.data?.message || e?.message || "Unable to complete the request.";
export const dateLabel = (
  date,
  options = { month: "short", day: "numeric" },
) =>
  date
    ? new Date(
        date.length === 10 ? date + "T12:00:00Z" : date,
      ).toLocaleDateString("en-IN", { ...options, timeZone: "Asia/Kolkata" })
    : "—";
export const fullName = (e) =>
  e ? `${e.firstName} ${e.lastName}` : "Unknown employee";
export const hours = (a) =>
  a.checkIn && a.checkOut
    ? ((new Date(a.checkOut) - new Date(a.checkIn)) / 3600000).toFixed(1)
    : null;
export const downloadCsv = (name, headers, rows) => {
  const safe = (v) => {
    let s = String(v ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const content = [headers, ...rows]
    .map((r) => r.map(safe).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
