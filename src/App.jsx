import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const COLORS = {
  crimson: "#C62828",
  crimsonDeep: "#8B0000",
  crimsonLight: "#EF5350",
  crimsonSurface: "#FFEBEE",
  white: "#FFFFFF",
  surface: "#FAFAFA",
  surfaceVar: "#F5F5F5",
  outline: "#E0E0E0",
  outlineVar: "#BDBDBD",
  onSurface: "#212121",
  onSurfaceMed: "#616161",
  onSurfaceLight: "#9E9E9E",
  success: "#2E7D32",
  successLight: "#E8F5E9",
  warning: "#F57F17",
  warningLight: "#FFFDE7",
  info: "#0277BD",
  infoLight: "#E1F5FE",
  scrim: "rgba(0,0,0,0.4)",
  // Dark mode
  darkBg: "#121212",
  darkSurface: "#1E1E1E",
  darkSurface2: "#2C2C2C",
  darkOutline: "#3A3A3A",
  darkOnSurface: "#E0E0E0",
  darkOnSurfaceMed: "#AAAAAA",
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const INITIAL_DONORS = [
  { id: 1, name: "Arjun Sharma", age: 28, bloodGroup: "O+", location: "Delhi", contact: "+91-9876543210", lastDonation: "2024-10-15", totalDonations: 5, status: "active" },
  { id: 2, name: "Priya Mehta", age: 32, bloodGroup: "A+", location: "Mumbai", contact: "+91-9812345678", lastDonation: "2025-01-20", totalDonations: 3, status: "active" },
  { id: 3, name: "Rahul Verma", age: 25, bloodGroup: "B+", location: "Delhi", contact: "+91-9988776655", lastDonation: "2025-03-01", totalDonations: 2, status: "active" },
  { id: 4, name: "Sunita Rao", age: 35, bloodGroup: "AB+", location: "Bangalore", contact: "+91-9765432100", lastDonation: "2024-08-10", totalDonations: 8, status: "active" },
  { id: 5, name: "Amit Patel", age: 29, bloodGroup: "O-", location: "Ahmedabad", contact: "+91-9654321098", lastDonation: "2025-02-15", totalDonations: 4, status: "active" },
  { id: 6, name: "Kavya Nair", age: 27, bloodGroup: "A-", location: "Chennai", contact: "+91-9543210987", lastDonation: "2024-11-30", totalDonations: 6, status: "active" },
  { id: 7, name: "Vikram Singh", age: 33, bloodGroup: "B-", location: "Delhi", contact: "+91-9432109876", lastDonation: "2025-01-05", totalDonations: 1, status: "inactive" },
  { id: 8, name: "Deepa Krishnan", age: 30, bloodGroup: "AB-", location: "Hyderabad", contact: "+91-9321098765", lastDonation: "2024-07-22", totalDonations: 7, status: "active" },
];

const INITIAL_INVENTORY = [
  { group: "A+", units: 45, capacity: 100 },
  { group: "A-", units: 12, capacity: 50 },
  { group: "B+", units: 38, capacity: 100 },
  { group: "B-", units: 8, capacity: 50 },
  { group: "AB+", units: 22, capacity: 60 },
  { group: "AB-", units: 5, capacity: 30 },
  { group: "O+", units: 67, capacity: 120 },
  { group: "O-", units: 15, capacity: 60 },
];

const INITIAL_REQUESTS = [
  { id: 1, patientName: "Ramesh Kumar", bloodGroup: "O+", units: 2, hospital: "AIIMS Delhi", urgency: "critical", status: "pending", requestDate: "2025-04-20", location: "Delhi", contact: "+91-9111222333" },
  { id: 2, patientName: "Geeta Sharma", bloodGroup: "A+", units: 1, hospital: "Fortis Hospital", urgency: "normal", status: "approved", requestDate: "2025-04-18", location: "Mumbai", contact: "+91-9222333444" },
  { id: 3, patientName: "Suresh Joshi", bloodGroup: "B-", units: 3, hospital: "Apollo Hospital", urgency: "critical", status: "completed", requestDate: "2025-04-15", location: "Delhi", contact: "+91-9333444555" },
  { id: 4, patientName: "Meena Pillai", bloodGroup: "AB+", units: 2, hospital: "Manipal Hospital", urgency: "normal", status: "pending", requestDate: "2025-04-21", location: "Bangalore", contact: "+91-9444555666" },
];

const NOTIFICATIONS = [
  { id: 1, type: "critical", message: "CRITICAL: O- blood stock critically low (5 units)", time: "2 min ago", read: false },
  { id: 2, type: "emergency", message: "Emergency request: O+ blood needed at AIIMS Delhi", time: "15 min ago", read: false },
  { id: 3, type: "reminder", message: "Donor Arjun Sharma is eligible to donate again", time: "1 hr ago", read: true },
  { id: 4, type: "info", message: "New donor registered: Kavya Nair (A-)", time: "3 hr ago", read: true },
];

// ─── UTILITY FUNCTIONS ─────────────────────────────────────────────────────
const checkEligibility = (lastDonation) => {
  if (!lastDonation) return true;
  const last = new Date(lastDonation);
  const now = new Date();
  const diff = (now - last) / (1000 * 60 * 60 * 24);
  return diff >= 90;
};

const getStockStatus = (units, capacity) => {
  const ratio = units / capacity;
  if (ratio <= 0.15) return "critical";
  if (ratio <= 0.3) return "low";
  if (ratio <= 0.7) return "normal";
  return "high";
};

const stockColor = (status, dark = false) => {
  if (status === "critical") return dark ? "#EF9A9A" : COLORS.crimson;
  if (status === "low") return dark ? "#FFE082" : COLORS.warning;
  if (status === "normal") return dark ? "#A5D6A7" : COLORS.success;
  return dark ? "#90CAF9" : COLORS.info;
};

const urgencyBadge = (urgency) =>
  urgency === "critical"
    ? { bg: "#FFEBEE", color: "#C62828", label: "🔴 Critical" }
    : { bg: "#E8F5E9", color: "#2E7D32", label: "🟢 Normal" };

const statusBadge = (status) => {
  if (status === "pending") return { bg: "#FFF8E1", color: "#F57F17", label: "Pending" };
  if (status === "approved") return { bg: "#E3F2FD", color: "#0277BD", label: "Approved" };
  if (status === "completed") return { bg: "#E8F5E9", color: "#2E7D32", label: "Completed" };
  return { bg: "#F5F5F5", color: "#616161", label: status };
};

// ─── ICON COMPONENTS ────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    dashboard: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z"/></svg>,
    donors: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
    inventory: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20 6h-2.18c.07-.44.18-.86.18-1.3C18 2.55 15.45 0 12 0 8.55 0 6 2.55 6 4.7c0 .44.11.86.18 1.3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-4c1.78 0 4 1.12 4 2.7 0 .44-.11.86-.18 1.3H8.18C8.11 6.16 8 5.74 8 5.3 8 3.12 10.22 2 12 2zm0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>,
    emergency: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>,
    admin: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z"/></svg>,
    notifications: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>,
    add: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>,
    delete: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
    blooddrop: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/></svg>,
    location: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
    phone: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>,
    sun: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/></svg>,
    moon: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>,
    filter: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>,
    trending: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>,
    warning: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>,
    person: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  };
  return icons[name] || null;
};

// ─── MINI CHART COMPONENTS ──────────────────────────────────────────────────
const MiniBarChart = ({ data, dark }) => {
  const max = Math.max(...data.map(d => d.units));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
      {data.map((d, i) => {
        const height = Math.max(4, (d.units / max) * 60);
        const status = getStockStatus(d.units, d.capacity);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height }}
              transition={{ delay: i * 0.05, duration: 0.6, ease: "easeOut" }}
              style={{
                width: "100%",
                background: stockColor(status, dark),
                borderRadius: "3px 3px 0 0",
                minHeight: 4,
              }}
            />
            <span style={{ fontSize: 8, marginTop: 2, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceLight }}>
              {d.group}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const DonutChart = ({ data, dark }) => {
  const size = 120;
  const cx = size / 2, cy = size / 2, r = 42, innerR = 28;
  const total = data.reduce((s, d) => s + d.units, 0);
  let angle = -Math.PI / 2;
  const segColors = ["#C62828","#EF5350","#E53935","#B71C1C","#FF8F00","#F57F17","#2E7D32","#43A047"];
  const paths = data.map((d, i) => {
    const slice = (d.units / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + slice), y2 = cy + r * Math.sin(angle + slice);
    const ix1 = cx + innerR * Math.cos(angle), iy1 = cy + innerR * Math.sin(angle);
    const ix2 = cx + innerR * Math.cos(angle + slice), iy2 = cy + innerR * Math.sin(angle + slice);
    const large = slice > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;
    angle += slice;
    return { path, color: segColors[i % segColors.length], label: d.group, units: d.units };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={size} height={size}>
        {paths.map((p, i) => (
          <motion.path key={i} d={p.path} fill={p.color} opacity={0.9}
            initial={{ opacity: 0 }} animate={{ opacity: 0.9 }}
            transition={{ delay: i * 0.08, duration: 0.4 }} />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="14" fontWeight="700"
          fill={dark ? COLORS.darkOnSurface : COLORS.onSurface}>{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8"
          fill={dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceLight}>UNITS</text>
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
        {paths.slice(0, 6).map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
            <span style={{ fontSize: 10, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>
              {p.label}: {p.units}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineSparkline = ({ values, color, dark }) => {
  const h = 40, w = 100;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]}
        r={3} fill={color} />
    </svg>
  );
};

// ─── MODAL COMPONENT ────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, dark }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: COLORS.scrim, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            background: dark ? COLORS.darkSurface : COLORS.white,
            borderRadius: 16, padding: 28, width: "100%", maxWidth: 520,
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, borderRadius: 8 }}>
              <Icon name="close" size={20} color="currentColor" />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── FORM INPUT ─────────────────────────────────────────────────────────────
const FormInput = ({ label, type = "text", value, onChange, options, dark, required }) => {
  const bg = dark ? COLORS.darkSurface2 : COLORS.surfaceVar;
  const border = dark ? COLORS.darkOutline : COLORS.outline;
  const textColor = dark ? COLORS.darkOnSurface : COLORS.onSurface;
  const style = {
    width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${border}`,
    background: bg, color: textColor, fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}{required && <span style={{ color: COLORS.crimson }}> *</span>}
      </label>
      {type === "select" ? (
        <select value={value} onChange={onChange} style={style}>
          <option value="">Select {label}</option>
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value} onChange={onChange} rows={3} style={{ ...style, resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={onChange} style={style} />
      )}
    </div>
  );
};

// ─── STAT CARD ──────────────────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon, color, trend, dark }) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
    style={{
      background: dark ? COLORS.darkSurface : COLORS.white,
      borderRadius: 16, padding: "20px 24px",
      boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
      borderLeft: `4px solid ${color}`,
      transition: "box-shadow 0.2s",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</p>
        <p style={{ fontSize: 32, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: "4px 0 4px", fontVariantNumeric: "tabular-nums" }}>{value}</p>
        <p style={{ fontSize: 12, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, margin: 0 }}>{subtitle}</p>
      </div>
      <div style={{ background: color + "22", borderRadius: 12, padding: 10, color }}>
        <Icon name={icon} size={22} color={color} />
      </div>
    </div>
    {trend && (
      <div style={{ marginTop: 12 }}>
        <LineSparkline values={trend} color={color} dark={dark} />
      </div>
    )}
  </motion.div>
);

// ─── BLOOD GROUP BADGE ──────────────────────────────────────────────────────
const BloodBadge = ({ group }) => (
  <span style={{
    background: COLORS.crimsonSurface, color: COLORS.crimsonDeep,
    fontWeight: 800, fontSize: 11, padding: "3px 8px", borderRadius: 20,
    border: `1px solid ${COLORS.crimsonLight}40`, letterSpacing: 0.5,
  }}>
    {group}
  </span>
);

// ─── BADGE ───────────────────────────────────────────────────────────────────
const Badge = ({ label, bg, color }) => (
  <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: 0.3 }}>
    {label}
  </span>
);

// ─── TOAST ───────────────────────────────────────────────────────────────────
const Toast = ({ toasts, dark }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, display: "flex", flexDirection: "column", gap: 8 }}>
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div key={t.id}
          initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
          style={{
            background: dark ? COLORS.darkSurface2 : COLORS.white,
            borderRadius: 12, padding: "12px 20px", boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            borderLeft: `4px solid ${t.type === "success" ? COLORS.success : t.type === "error" ? COLORS.crimson : COLORS.info}`,
            color: dark ? COLORS.darkOnSurface : COLORS.onSurface, fontSize: 13, maxWidth: 300,
          }}
        >
          {t.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin, dark }) => {
  const [email, setEmail] = useState("admin@bloodbank.org");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    onLogin({ email, role, name: role === "admin" ? "Dr. Admin" : role === "donor" ? "Arjun Sharma" : "Hospital User" });
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: dark
        ? `radial-gradient(ellipse at 20% 50%, #2C0000 0%, ${COLORS.darkBg} 60%)`
        : `radial-gradient(ellipse at 20% 50%, #FFEBEE 0%, #FAFAFA 60%)`,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: 16,
    }}>
      <div style={{ display: "flex", width: "100%", maxWidth: 900, borderRadius: 24, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.2)" }}>
        {/* Left panel */}
        <motion.div
          initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }}
          style={{
            flex: "0 0 45%", background: `linear-gradient(145deg, ${COLORS.crimsonDeep}, ${COLORS.crimson})`,
            padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center",
            display: window.innerWidth < 600 ? "none" : "flex",
          }}
        >
          <div style={{ color: COLORS.white }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 10 }}>
                <Icon name="blooddrop" size={28} color={COLORS.white} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif" }}>LifeFlow</div>
                <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1.5, textTransform: "uppercase" }}>Blood Bank System</div>
              </div>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 16, fontFamily: "'Playfair Display', Georgia, serif" }}>
              Save Lives,<br />Give Blood
            </h1>
            <p style={{ opacity: 0.8, lineHeight: 1.6, fontSize: 14 }}>
              Advanced blood bank management for modern hospitals. Track inventory, manage donors, and respond to emergencies in real-time.
            </p>
            <div style={{ marginTop: 32, display: "flex", gap: 24 }}>
              {[["847", "Donors"], ["12,430", "Units"], ["99.2%", "Efficiency"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{v}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right panel */}
        <motion.div
          initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            flex: 1, padding: "48px 40px",
            background: dark ? COLORS.darkSurface : COLORS.white,
          }}
        >
          <h2 style={{ fontSize: 26, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, marginBottom: 8, fontFamily: "'Playfair Display', Georgia, serif" }}>
            Welcome back
          </h2>
          <p style={{ color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, fontSize: 14, marginBottom: 32 }}>Sign in to your account</p>

          {/* Role selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["admin", "donor", "hospital"].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 10, border: `1.5px solid ${role === r ? COLORS.crimson : (dark ? COLORS.darkOutline : COLORS.outline)}`,
                background: role === r ? COLORS.crimsonSurface : "transparent",
                color: role === r ? COLORS.crimson : (dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed),
                cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                textTransform: "capitalize", transition: "all 0.2s",
              }}>
                {r === "admin" ? "🛡 Admin" : r === "donor" ? "🩸 Donor" : "🏥 Hospital"}
              </button>
            ))}
          </div>

          <FormInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} dark={dark} />
          <FormInput label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} dark={dark} />

          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={handleLogin} disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: loading ? COLORS.outlineVar : `linear-gradient(135deg, ${COLORS.crimson}, ${COLORS.crimsonDeep})`,
              color: COLORS.white, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", marginTop: 8, letterSpacing: 0.3, transition: "background 0.3s",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: COLORS.white, borderRadius: "50%" }} />
                Signing in...
              </span>
            ) : "Sign In →"}
          </motion.button>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceLight }}>
            Demo credentials pre-filled. Just click Sign In.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// ─── DASHBOARD PAGE ──────────────────────────────────────────────────────────
const DashboardPage = ({ donors, inventory, requests, dark }) => {
  const totalDonors = donors.length;
  const totalUnits = inventory.reduce((s, i) => s + i.units, 0);
  const criticalRequests = requests.filter(r => r.urgency === "critical" && r.status === "pending").length;
  const completedRequests = requests.filter(r => r.status === "completed").length;
  const lowStock = inventory.filter(i => getStockStatus(i.units, i.capacity) === "critical" || getStockStatus(i.units, i.capacity) === "low");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
          Overview Dashboard
        </h1>
        <p style={{ color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, marginTop: 4, fontSize: 14 }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Alert Banner */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: "#FFF3E0", border: "1px solid #FFB300", borderRadius: 12, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 12, marginBottom: 24, color: "#E65100",
          }}
        >
          <Icon name="warning" size={20} color="#E65100" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            ⚠️ Low stock alert: {lowStock.map(s => s.group).join(", ")} blood groups need replenishment
          </span>
        </motion.div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard title="Total Donors" value={totalDonors} subtitle="Registered donors" icon="donors" color={COLORS.info} trend={[42,45,43,47,50,48,totalDonors]} dark={dark} />
        <StatCard title="Blood Units" value={totalUnits} subtitle="In inventory" icon="blooddrop" color={COLORS.crimson} trend={[180,195,210,200,215,220,totalUnits]} dark={dark} />
        <StatCard title="Pending Requests" value={criticalRequests} subtitle="Needs immediate action" icon="emergency" color={COLORS.warning} dark={dark} />
        <StatCard title="Requests Fulfilled" value={completedRequests} subtitle="Successfully completed" icon="check" color={COLORS.success} trend={[2,3,2,4,3,5,completedRequests]} dark={dark} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 28 }}>
        {/* Inventory chart */}
        <div style={{ background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 16, padding: 24, boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: "0 0 4px" }}>Blood Inventory</h3>
          <p style={{ fontSize: 12, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, marginBottom: 16 }}>Current stock by blood group</p>
          <MiniBarChart data={inventory} dark={dark} />
        </div>

        {/* Donut chart */}
        <div style={{ background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 16, padding: 24, boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: "0 0 4px" }}>Distribution</h3>
          <p style={{ fontSize: 12, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, marginBottom: 16 }}>Units by blood type</p>
          <DonutChart data={inventory} dark={dark} />
        </div>

        {/* Stock table */}
        <div style={{ background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 16, padding: 24, boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: "0 0 16px" }}>Stock Levels</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {inventory.map(item => {
              const status = getStockStatus(item.units, item.capacity);
              const pct = (item.units / item.capacity) * 100;
              return (
                <div key={item.group}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: dark ? COLORS.darkOnSurface : COLORS.onSurface }}>{item.group}</span>
                    <span style={{ fontSize: 11, color: stockColor(status, dark), fontWeight: 700 }}>{item.units}/{item.capacity}</span>
                  </div>
                  <div style={{ height: 6, background: dark ? COLORS.darkOutline : COLORS.outline, borderRadius: 3 }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 3, background: stockColor(status, dark) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent requests */}
      <div style={{ background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 16, padding: 24, boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: "0 0 16px" }}>Recent Requests</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.slice(0, 4).map(req => {
            const ub = urgencyBadge(req.urgency);
            const sb = statusBadge(req.status);
            return (
              <motion.div key={req.id} whileHover={{ x: 4 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  background: dark ? COLORS.darkSurface2 : COLORS.surfaceVar,
                  borderRadius: 10, justifyContent: "space-between", flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <BloodBadge group={req.bloodGroup} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: dark ? COLORS.darkOnSurface : COLORS.onSurface }}>{req.patientName}</div>
                    <div style={{ fontSize: 11, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>{req.hospital} · {req.units} units</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge {...ub} />
                  <Badge {...sb} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── DONORS PAGE ─────────────────────────────────────────────────────────────
const DonorsPage = ({ donors, setDonors, dark, addToast }) => {
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", bloodGroup: "", location: "", contact: "", lastDonation: "" });

  const filtered = donors.filter(d => {
    const q = search.toLowerCase();
    return (
      (!search || d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q)) &&
      (!filterGroup || d.bloodGroup === filterGroup) &&
      (!filterCity || d.location.toLowerCase().includes(filterCity.toLowerCase()))
    );
  });

  const register = () => {
    if (!form.name || !form.age || !form.bloodGroup || !form.location || !form.contact) {
      addToast("Please fill all required fields", "error"); return;
    }
    setDonors(prev => [...prev, { ...form, id: Date.now(), age: +form.age, totalDonations: 0, status: "active" }]);
    setShowModal(false);
    setForm({ name: "", age: "", bloodGroup: "", location: "", contact: "", lastDonation: "" });
    addToast("Donor registered successfully!", "success");
  };

  const cities = [...new Set(donors.map(d => d.location))];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Donor Management</h1>
          <p style={{ color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, marginTop: 4, fontSize: 13 }}>{donors.length} registered donors</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: `linear-gradient(135deg, ${COLORS.crimson}, ${COLORS.crimsonDeep})`, color: COLORS.white, border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}
        >
          <Icon name="add" size={18} color={COLORS.white} /> Register Donor
        </motion.button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", position: "relative" }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={16} color={dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed} />
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donors..."
            style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 10, border: `1.5px solid ${dark ? COLORS.darkOutline : COLORS.outline}`, background: dark ? COLORS.darkSurface : COLORS.white, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${dark ? COLORS.darkOutline : COLORS.outline}`, background: dark ? COLORS.darkSurface : COLORS.white, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, fontSize: 14, outline: "none", fontFamily: "inherit" }}>
          <option value="">All Blood Groups</option>
          {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
        </select>
        <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${dark ? COLORS.darkOutline : COLORS.outline}`, background: dark ? COLORS.darkSurface : COLORS.white, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, fontSize: 14, outline: "none", fontFamily: "inherit" }}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Donor cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        <AnimatePresence>
          {filtered.map((d, i) => {
            const eligible = checkEligibility(d.lastDonation);
            return (
              <motion.div key={d.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
                style={{
                  background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 16, padding: 20,
                  boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "box-shadow 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.crimsonSurface}, ${COLORS.crimsonLight}30)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: COLORS.crimson }}>
                      {d.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>Age {d.age}</div>
                    </div>
                  </div>
                  <BloodBadge group={d.bloodGroup} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {[[d.location, "location"], [d.contact, "phone"]].map(([val, icon]) => (
                    <div key={icon} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name={icon} size={13} color={dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed} />
                      <span style={{ fontSize: 12, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>{val}</span>
                    </div>
                  ))}
                  {d.lastDonation && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="calendar" size={13} color={dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed} />
                      <span style={{ fontSize: 12, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>Last: {d.lastDonation}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    background: eligible ? COLORS.successLight : COLORS.warningLight,
                    color: eligible ? COLORS.success : COLORS.warning,
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20
                  }}>
                    {eligible ? "✓ Eligible" : "⏳ Not eligible"}
                  </span>
                  <span style={{ fontSize: 11, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>
                    🩸 {d.totalDonations} donations
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No donors found</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Try adjusting your search or filters</div>
        </div>
      )}

      {/* Register Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Register New Donor" dark={dark}>
        <FormInput label="Full Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} dark={dark} required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormInput label="Age" type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} dark={dark} required />
          <FormInput label="Blood Group" type="select" value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))} options={BLOOD_GROUPS} dark={dark} required />
        </div>
        <FormInput label="Location / City" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} dark={dark} required />
        <FormInput label="Contact Number" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} dark={dark} required />
        <FormInput label="Last Donation Date" type="date" value={form.lastDonation} onChange={e => setForm(p => ({ ...p, lastDonation: e.target.value }))} dark={dark} />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1.5px solid ${dark ? COLORS.darkOutline : COLORS.outline}`, background: "transparent", color: dark ? COLORS.darkOnSurface : COLORS.onSurface, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Cancel</button>
          <button onClick={register} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${COLORS.crimson}, ${COLORS.crimsonDeep})`, color: COLORS.white, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14 }}>Register Donor</button>
        </div>
      </Modal>
    </div>
  );
};

// ─── INVENTORY PAGE ──────────────────────────────────────────────────────────
const InventoryPage = ({ inventory, setInventory, dark, addToast }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ group: "", units: "", action: "add" });

  const updateStock = () => {
    if (!form.group || !form.units) { addToast("Please fill all fields", "error"); return; }
    setInventory(prev => prev.map(item => {
      if (item.group !== form.group) return item;
      const delta = form.action === "add" ? +form.units : -Math.min(+form.units, item.units);
      return { ...item, units: Math.max(0, item.units + delta) };
    }));
    setShowModal(false);
    addToast(`Stock ${form.action === "add" ? "added" : "used"} for ${form.group}`, "success");
    setForm({ group: "", units: "", action: "add" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Blood Inventory</h1>
          <p style={{ color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, marginTop: 4, fontSize: 13 }}>Monitor and manage blood stock levels</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: `linear-gradient(135deg, ${COLORS.crimson}, ${COLORS.crimsonDeep})`, color: COLORS.white, border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}
        >
          <Icon name="add" size={18} color={COLORS.white} /> Update Stock
        </motion.button>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Units", val: inventory.reduce((s, i) => s + i.units, 0), color: COLORS.info },
          { label: "Critical Stock", val: inventory.filter(i => getStockStatus(i.units, i.capacity) === "critical").length + " groups", color: COLORS.crimson },
          { label: "Adequate Stock", val: inventory.filter(i => ["normal", "high"].includes(getStockStatus(i.units, i.capacity))).length + " groups", color: COLORS.success },
          { label: "Total Capacity", val: inventory.reduce((s, i) => s + i.capacity, 0), color: COLORS.warning },
        ].map(s => (
          <div key={s.label} style={{ background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 12, padding: "16px 20px", boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)", borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface }}>{s.val}</div>
            <div style={{ fontSize: 11, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Inventory cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {inventory.map((item, i) => {
          const status = getStockStatus(item.units, item.capacity);
          const pct = (item.units / item.capacity) * 100;
          const color = stockColor(status, dark);
          return (
            <motion.div key={item.group}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
              style={{
                background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 16, padding: "24px 20px",
                boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
                transition: "box-shadow 0.2s", position: "relative", overflow: "hidden",
              }}
            >
              {status === "critical" && (
                <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: COLORS.crimson }} />
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Playfair Display', Georgia, serif" }}>{item.group}</div>
                  <div style={{ fontSize: 11, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, textTransform: "uppercase", letterSpacing: 1 }}>Blood Group</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, lineHeight: 1 }}>{item.units}</div>
                  <div style={{ fontSize: 10, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>/ {item.capacity} units</div>
                </div>
              </div>

              <div style={{ height: 8, background: dark ? COLORS.darkOutline : COLORS.outline, borderRadius: 4, marginBottom: 10 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: 4, background: color }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color, background: color + "22", padding: "3px 8px", borderRadius: 20, textTransform: "capitalize" }}>
                  {status === "critical" ? "🔴 Critical" : status === "low" ? "🟡 Low" : status === "normal" ? "🟢 Normal" : "🔵 High"}
                </span>
                <span style={{ fontSize: 11, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>{pct.toFixed(0)}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Update Blood Stock" dark={dark}>
        <FormInput label="Blood Group" type="select" value={form.group} onChange={e => setForm(p => ({ ...p, group: e.target.value }))} options={BLOOD_GROUPS} dark={dark} required />
        <FormInput label="Number of Units" type="number" value={form.units} onChange={e => setForm(p => ({ ...p, units: e.target.value }))} dark={dark} required />
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Action</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["add", "use"].map(a => (
              <button key={a} onClick={() => setForm(p => ({ ...p, action: a }))
              } style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${form.action === a ? COLORS.crimson : (dark ? COLORS.darkOutline : COLORS.outline)}`, background: form.action === a ? COLORS.crimsonSurface : "transparent", color: form.action === a ? COLORS.crimson : (dark ? COLORS.darkOnSurface : COLORS.onSurface), cursor: "pointer", fontWeight: 700, fontFamily: "inherit", textTransform: "capitalize" }}>
                {a === "add" ? "➕ Add Stock" : "➖ Use Blood"}
              </button>
            ))}
          </div>
        </div>
        <button onClick={updateStock} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${COLORS.crimson}, ${COLORS.crimsonDeep})`, color: COLORS.white, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>
          Update Inventory
        </button>
      </Modal>
    </div>
  );
};

// ─── EMERGENCY PAGE ──────────────────────────────────────────────────────────
const EmergencyPage = ({ requests, setRequests, donors, inventory, dark, addToast }) => {
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [form, setForm] = useState({ patientName: "", bloodGroup: "", units: "1", hospital: "", urgency: "normal", location: "", contact: "" });

  const submitRequest = () => {
    if (!form.patientName || !form.bloodGroup || !form.hospital || !form.location || !form.contact) {
      addToast("Please fill all required fields", "error"); return;
    }
    const newReq = { ...form, id: Date.now(), units: +form.units, status: "pending", requestDate: new Date().toISOString().slice(0, 10) };
    setRequests(prev => [newReq, ...prev]);
    setShowModal(false);
    setForm({ patientName: "", bloodGroup: "", units: "1", hospital: "", urgency: "normal", location: "", contact: "" });
    addToast(form.urgency === "critical" ? "🚨 Critical request submitted! Matching donors..." : "Request submitted successfully", form.urgency === "critical" ? "error" : "success");
  };

  const matchDonors = (req) => donors.filter(d => d.bloodGroup === req.bloodGroup && d.location.toLowerCase() === req.location.toLowerCase() && checkEligibility(d.lastDonation));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Emergency Requests</h1>
          <p style={{ color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, marginTop: 4, fontSize: 13 }}>{requests.filter(r => r.status === "pending").length} pending requests</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: `linear-gradient(135deg, ${COLORS.crimson}, ${COLORS.crimsonDeep})`, color: COLORS.white, border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}
        >
          <Icon name="emergency" size={18} color={COLORS.white} /> New Request
        </motion.button>
      </div>

      {/* Request list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <AnimatePresence>
          {requests.map((req, i) => {
            const ub = urgencyBadge(req.urgency);
            const sb = statusBadge(req.status);
            const matched = matchDonors(req);
            return (
              <motion.div key={req.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{
                  background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 14, padding: "18px 20px",
                  boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
                  borderLeft: `4px solid ${req.urgency === "critical" ? COLORS.crimson : COLORS.success}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <BloodBadge group={req.bloodGroup} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface }}>{req.patientName}</div>
                      <div style={{ fontSize: 12, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>{req.hospital} · {req.units} unit{req.units > 1 ? "s" : ""} · {req.location}</div>
                      <div style={{ fontSize: 11, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceLight, marginTop: 2 }}>{req.requestDate}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <Badge {...ub} />
                    <Badge {...sb} />
                    {matched.length > 0 && (
                      <span style={{ background: COLORS.infoLight, color: COLORS.info, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                        {matched.length} donor{matched.length > 1 ? "s" : ""} matched
                      </span>
                    )}
                    <button onClick={() => setViewModal(req)}
                      style={{ background: "none", border: `1px solid ${dark ? COLORS.darkOutline : COLORS.outline}`, borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, fontFamily: "inherit" }}>
                      View
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* New Request Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Emergency Request" dark={dark}>
        <FormInput label="Patient Name" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} dark={dark} required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormInput label="Blood Group" type="select" value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))} options={BLOOD_GROUPS} dark={dark} required />
          <FormInput label="Units Needed" type="number" value={form.units} onChange={e => setForm(p => ({ ...p, units: e.target.value }))} dark={dark} required />
        </div>
        <FormInput label="Hospital Name" value={form.hospital} onChange={e => setForm(p => ({ ...p, hospital: e.target.value }))} dark={dark} required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormInput label="Location / City" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} dark={dark} required />
          <FormInput label="Contact Number" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} dark={dark} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Urgency Level</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["normal", "critical"].map(u => (
              <button key={u} onClick={() => setForm(p => ({ ...p, urgency: u }))}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${form.urgency === u ? (u === "critical" ? COLORS.crimson : COLORS.success) : (dark ? COLORS.darkOutline : COLORS.outline)}`, background: form.urgency === u ? (u === "critical" ? COLORS.crimsonSurface : COLORS.successLight) : "transparent", color: form.urgency === u ? (u === "critical" ? COLORS.crimson : COLORS.success) : (dark ? COLORS.darkOnSurface : COLORS.onSurface), cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>
                {u === "critical" ? "🔴 Critical" : "🟢 Normal"}
              </button>
            ))}
          </div>
        </div>
        <button onClick={submitRequest} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${COLORS.crimson}, ${COLORS.crimsonDeep})`, color: COLORS.white, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>
          Submit Request
        </button>
      </Modal>

      {/* View Request Modal */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={() => setViewModal(null)} title="Request Details" dark={dark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Patient", viewModal.patientName],
              ["Blood Group", viewModal.bloodGroup],
              ["Units Needed", viewModal.units],
              ["Hospital", viewModal.hospital],
              ["Location", viewModal.location],
              ["Contact", viewModal.contact],
              ["Date", viewModal.requestDate],
              ["Status", viewModal.status],
              ["Urgency", viewModal.urgency],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: dark ? COLORS.darkSurface2 : COLORS.surfaceVar, borderRadius: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, textTransform: "uppercase", letterSpacing: 0.5 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface }}>{String(v)}</span>
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, marginBottom: 8 }}>Matched Donors ({matchDonors(viewModal).length})</div>
              {matchDonors(viewModal).length === 0 ? (
                <p style={{ fontSize: 12, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>No eligible donors in {viewModal.location} with {viewModal.bloodGroup}</p>
              ) : matchDonors(viewModal).map(d => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: COLORS.successLight, borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.success }}>{d.name}</span>
                  <span style={{ fontSize: 11, color: COLORS.success }}>{d.contact}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── ADMIN PAGE ──────────────────────────────────────────────────────────────
const AdminPage = ({ donors, requests, setRequests, inventory, dark, addToast }) => {
  const updateStatus = (id, status) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    addToast(`Request ${status}`, "success");
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Admin Control Panel</h1>
        <p style={{ color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, marginTop: 4, fontSize: 13 }}>Manage requests, donors, and system settings</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          ["Total Donors", donors.length, COLORS.info],
          ["Pending", requests.filter(r => r.status === "pending").length, COLORS.warning],
          ["Approved", requests.filter(r => r.status === "approved").length, COLORS.info],
          ["Completed", requests.filter(r => r.status === "completed").length, COLORS.success],
          ["Critical Stock", inventory.filter(i => getStockStatus(i.units, i.capacity) === "critical").length, COLORS.crimson],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 12, padding: "16px 20px", boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)", borderBottom: `3px solid ${c}` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface }}>{v}</div>
            <div style={{ fontSize: 11, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Manage requests */}
      <div style={{ background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 16, padding: 24, boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, marginBottom: 16 }}>Manage Blood Requests</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map(req => {
            const ub = urgencyBadge(req.urgency);
            const sb = statusBadge(req.status);
            return (
              <div key={req.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", background: dark ? COLORS.darkSurface2 : COLORS.surfaceVar, borderRadius: 10, flexWrap: "wrap", gap: 10
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <BloodBadge group={req.bloodGroup} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface }}>{req.patientName}</div>
                    <div style={{ fontSize: 11, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>{req.hospital} · {req.location}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <Badge {...ub} />
                  <Badge {...sb} />
                  {req.status === "pending" && (
                    <>
                      <motion.button whileHover={{ scale: 1.05 }} onClick={() => updateStatus(req.id, "approved")}
                        style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: COLORS.successLight, color: COLORS.success, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>
                        ✓ Approve
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} onClick={() => updateStatus(req.id, "completed")}
                        style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: COLORS.infoLight, color: COLORS.info, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>
                        ✓ Complete
                      </motion.button>
                    </>
                  )}
                  {req.status === "approved" && (
                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => updateStatus(req.id, "completed")}
                      style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: COLORS.infoLight, color: COLORS.info, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>
                      Mark Complete
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donor table */}
      <div style={{ background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 16, padding: 24, boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, marginBottom: 16 }}>All Donors</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: dark ? COLORS.darkSurface2 : COLORS.surfaceVar }}>
                {["Name", "Age", "Blood Group", "Location", "Last Donation", "Eligible", "Donations"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donors.map((d, i) => {
                const eligible = checkEligibility(d.lastDonation);
                return (
                  <tr key={d.id} style={{ borderTop: `1px solid ${dark ? COLORS.darkOutline : COLORS.outline}` }}>
                    <td style={{ padding: "10px 14px", color: dark ? COLORS.darkOnSurface : COLORS.onSurface, fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: "10px 14px", color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>{d.age}</td>
                    <td style={{ padding: "10px 14px" }}><BloodBadge group={d.bloodGroup} /></td>
                    <td style={{ padding: "10px 14px", color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>{d.location}</td>
                    <td style={{ padding: "10px 14px", color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed }}>{d.lastDonation || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: eligible ? COLORS.success : COLORS.warning, fontWeight: 700, fontSize: 12 }}>
                        {eligible ? "✓ Yes" : "✗ No"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: dark ? COLORS.darkOnSurface : COLORS.onSurface, fontWeight: 700 }}>{d.totalDonations}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── NOTIFICATIONS PAGE ──────────────────────────────────────────────────────
const NotificationsPage = ({ notifications, setNotifications, dark }) => {
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const notifColor = (type) => type === "critical" ? COLORS.crimson : type === "emergency" ? COLORS.warning : type === "reminder" ? COLORS.success : COLORS.info;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Notifications</h1>
          <p style={{ color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, marginTop: 4, fontSize: 13 }}>{notifications.filter(n => !n.read).length} unread</p>
        </div>
        <button onClick={markAllRead} style={{ background: "none", border: `1.5px solid ${dark ? COLORS.darkOutline : COLORS.outline}`, borderRadius: 10, padding: "8px 16px", cursor: "pointer", color: dark ? COLORS.darkOnSurface : COLORS.onSurface, fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
          Mark all read
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifications.map((n, i) => {
          const c = notifColor(n.type);
          return (
            <motion.div key={n.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
              style={{
                background: dark ? COLORS.darkSurface : COLORS.white, borderRadius: 12, padding: "16px 20px",
                boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
                borderLeft: `4px solid ${n.read ? (dark ? COLORS.darkOutline : COLORS.outline) : c}`,
                cursor: "pointer", opacity: n.read ? 0.65 : 1, transition: "opacity 0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: c + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={n.type === "critical" || n.type === "emergency" ? "warning" : n.type === "reminder" ? "calendar" : "notifications"} size={16} color={c} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceLight, marginTop: 4 }}>{n.time}</div>
                  </div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0, marginTop: 4 }} />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const Sidebar = ({ page, setPage, dark, user, onLogout, unread, mobileOpen, setMobileOpen }) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "donors", label: "Donors", icon: "donors" },
    { id: "inventory", label: "Inventory", icon: "inventory" },
    { id: "emergency", label: "Emergency", icon: "emergency" },
    { id: "admin", label: "Admin Panel", icon: "admin" },
    { id: "notifications", label: "Notifications", icon: "notifications", badge: unread },
  ];

  const content = (
    <div style={{
      width: 240, height: "100%", background: dark ? COLORS.darkSurface : COLORS.white,
      borderRight: `1px solid ${dark ? COLORS.darkOutline : COLORS.outline}`,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${dark ? COLORS.darkOutline : COLORS.outline}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: `linear-gradient(135deg, ${COLORS.crimson}, ${COLORS.crimsonDeep})`, borderRadius: 10, padding: 8 }}>
            <Icon name="blooddrop" size={20} color={COLORS.white} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, fontFamily: "'Playfair Display', Georgia, serif" }}>LifeFlow</div>
            <div style={{ fontSize: 9, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceLight, textTransform: "uppercase", letterSpacing: 1.5 }}>Blood Bank</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${dark ? COLORS.darkOutline : COLORS.outline}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: dark ? COLORS.darkSurface2 : COLORS.surfaceVar, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.crimson}, ${COLORS.crimsonDeep})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: COLORS.white }}>
            {user?.name?.[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, textTransform: "capitalize" }}>{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
        {navItems.map(item => {
          const active = page === item.id;
          return (
            <motion.button key={item.id}
              whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setPage(item.id); setMobileOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                background: active ? `${COLORS.crimson}15` : "transparent",
                color: active ? COLORS.crimson : (dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed),
                fontWeight: active ? 700 : 500, fontSize: 14, marginBottom: 2, transition: "all 0.15s",
                position: "relative",
              }}
            >
              {active && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: "0 3px 3px 0", background: COLORS.crimson }} />}
              <Icon name={item.icon} size={19} color={active ? COLORS.crimson : (dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed)} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ marginLeft: "auto", background: COLORS.crimson, color: COLORS.white, borderRadius: 10, fontSize: 10, fontWeight: 800, padding: "2px 6px", minWidth: 16, textAlign: "center" }}>{item.badge}</span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${dark ? COLORS.darkOutline : COLORS.outline}` }}>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: dark ? COLORS.darkOnSurfaceMed : COLORS.onSurfaceMed, fontFamily: "inherit", fontSize: 14, fontWeight: 500 }}>
          <Icon name="logout" size={19} color="currentColor" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div style={{ display: "none", height: "100vh", position: "sticky", top: 0, flexShrink: 0 }} className="desktop-sidebar">
        {content}
      </div>
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: COLORS.scrim, zIndex: 500 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{ width: 240, height: "100%" }}
              onClick={e => e.stopPropagation()}
            >
              {content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Always-visible desktop sidebar via inline style trick */}
      <style>{`
        @media (min-width: 768px) { .desktop-sidebar { display: block !important; } }
      `}</style>
    </>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [donors, setDonors] = useState(INITIAL_DONORS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [toasts, setToasts] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const bg = dark
    ? `linear-gradient(135deg, ${COLORS.darkBg} 0%, #1A0000 100%)`
    : `linear-gradient(135deg, #FAFAFA 0%, #FFF5F5 100%)`;

  const renderPage = () => {
    const props = { donors, inventory, requests, dark, addToast };
    if (page === "dashboard") return <DashboardPage {...props} />;
    if (page === "donors") return <DonorsPage {...props} setDonors={setDonors} />;
    if (page === "inventory") return <InventoryPage {...props} setInventory={setInventory} />;
    if (page === "emergency") return <EmergencyPage {...props} setRequests={setRequests} />;
    if (page === "admin") return <AdminPage {...props} setRequests={setRequests} />;
    if (page === "notifications") return <NotificationsPage notifications={notifications} setNotifications={setNotifications} dark={dark} />;
  };

  if (!user) return <LoginPage onLogin={setUser} dark={dark} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: dark ? COLORS.darkBg : COLORS.surface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #C62828; border-radius: 4px; }
      `}</style>

      {/* Sidebar */}
      <Sidebar page={page} setPage={setPage} dark={dark} user={user} onLogout={() => setUser(null)}
        unread={unread} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: 60, background: dark ? COLORS.darkSurface : COLORS.white,
          borderBottom: `1px solid ${dark ? COLORS.darkOutline : COLORS.outline}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, display: "none" }} className="mobile-menu-btn">
              <Icon name="menu" size={22} color="currentColor" />
            </button>
            <style>{`@media (max-width: 767px) { .mobile-menu-btn { display: block !important; } }`}</style>
            <span style={{ fontSize: 14, fontWeight: 700, color: dark ? COLORS.darkOnSurface : COLORS.onSurface, textTransform: "capitalize" }}>{page}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Critical alert */}
            {requests.some(r => r.urgency === "critical" && r.status === "pending") && (
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                style={{ background: COLORS.crimsonSurface, color: COLORS.crimson, fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 20, border: `1px solid ${COLORS.crimsonLight}` }}>
                🚨 Critical
              </motion.div>
            )}
            {/* Dark mode toggle */}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setDark(d => !d)}
              style={{ background: dark ? COLORS.darkSurface2 : COLORS.surfaceVar, border: "none", borderRadius: 10, padding: 8, cursor: "pointer", color: dark ? COLORS.darkOnSurface : COLORS.onSurface }}>
              <Icon name={dark ? "sun" : "moon"} size={18} color="currentColor" />
            </motion.button>
            {/* Notification bell */}
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setPage("notifications")}
              style={{ background: dark ? COLORS.darkSurface2 : COLORS.surfaceVar, border: "none", borderRadius: 10, padding: 8, cursor: "pointer", position: "relative", color: dark ? COLORS.darkOnSurface : COLORS.onSurface }}>
              <Icon name="notifications" size={18} color="currentColor" />
              {unread > 0 && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: COLORS.crimson }} />}
            </motion.button>
          </div>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, padding: "24px 20px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
          <AnimatePresence mode="wait">
            <motion.div key={page}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Toast toasts={toasts} dark={dark} />
    </div>
  );
}
