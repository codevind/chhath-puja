import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { SITE_CONFIG } from "../config";
import type { Contributor } from "./Contributors";
import { normalizeMobileNumber } from "../utils/mobileNumber";
import { QRCodeSVG } from "qrcode.react";

const Dialog = styled.dialog`
  width: min(520px, calc(100% - 32px));
  max-height: 90vh;
  overflow: auto;
  padding: 28px;
  border: 1px solid var(--puja-border);
  border-radius: 22px;
  background: var(--puja-surface);
  color: var(--puja-text);
  &::backdrop { background: #301b12aa; }
  h2 { margin: 0 0 12px; color: var(--puja-heading); font-family: Georgia, serif; }
  label { display: grid; gap: 8px; margin-top: 18px; font-weight: 700; }
  input, select { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid var(--puja-border); border-radius: 10px; font: inherit; background: white; }
  button { cursor: pointer; font: inherit; }
  button:disabled { opacity: .6; cursor: wait; }
`;
const Submit = styled.button`
  width: 100%; margin-top: 22px; padding: 13px; border: 0;
  border-radius: 12px; background: var(--puja-primary-gradient); color: white; font-weight: 700;
`;

type ApiResult = { ok: boolean; error?: string; token?: string; receiptId?: string; date?: string; time?: string };
export async function adminRequest(data: Record<string, unknown>): Promise<ApiResult> {
  if (!SITE_CONFIG.adminApiUrl) throw new Error("Admin connection is not configured yet. Follow docs/admin-setup.md.");
  const response = await fetch(SITE_CONFIG.adminApiUrl, {
    method: "POST", redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Unable to reach the admin service.");
  const result: ApiResult = await response.json();
  if (!result.ok) throw new Error(result.error || "Request failed.");
  return result;
}

export default function AdminSection({ onClose, token, onLogin, onLogout, entry, onSaved }: {
  onClose: () => void;
  token: string;
  onLogin: (token: string) => void;
  onLogout: () => Promise<void>;
  entry: Contributor | null;
  onSaved: (entry: Contributor) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(entry?.name ?? "");
  const [mobileNumber, setMobileNumber] = useState(entry?.mobileNumber ?? "");
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [mode, setMode] = useState(entry?.mode === "Online" || (!entry?.mode && entry?.status === "verify") ? "Online" : "Cash");
  const [status, setStatus] = useState(entry?.status.toLowerCase() === "verify" ? "" : entry?.status === "done" ? "done" : "pending");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const paymentAmount = Number(amount);
  const validPaymentAmount = Number.isFinite(paymentAmount) && paymentAmount > 0 && Math.abs(paymentAmount * 100 - Math.round(paymentAmount * 100)) <= 0.00001;
  const upiLink = `upi://pay?${new URLSearchParams({
    pa: SITE_CONFIG.upiId,
    pn: SITE_CONFIG.payeeName,
    tn: SITE_CONFIG.donationNote,
    am: validPaymentAmount ? paymentAmount.toFixed(2) : "",
    cu: "INR",
    tr: (entry?.receiptId ?? requestId.current).replace(/^CPS-/, "").replace(/-/g, "").slice(0, 35),
  }).toString()}`;

  useEffect(() => { dialog.current?.showModal(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      if (!token) {
        const result = await adminRequest({ action: "login", userId: userId.trim(), password });
        if (!result.token) throw new Error("Invalid login response.");
        onLogin(result.token); setPassword("");
      } else {
        if (!name.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new Error("Enter a name and an amount greater than zero.");
        if (!["done", "pending"].includes(status)) throw new Error("Select Done or Pending before submitting.");
        const mobile = normalizeMobileNumber(mobileNumber);
        const result = await adminRequest({ action: entry ? "update" : "create", receiptId: entry?.receiptId, token, name: name.trim(), mobileNumber: mobile, amount: Number(amount), mode, status, requestId: requestId.current });
        if (!result.receiptId) throw new Error("Save could not be confirmed. Retry to confirm the same entry.");
        onSaved({ receiptId: result.receiptId, name: name.trim(), mobileNumber: mobile, amount: Number(amount), mode, status, date: result.date ?? entry?.date ?? "", time: result.time ?? entry?.time ?? "" });
        if (entry) { onClose(); return; }
        setSuccess(`Saved. Receipt ID: ${result.receiptId}. ${result.date} ${result.time} (IST).`);
        setName(""); setMobileNumber(""); setAmount(""); setMode("Cash"); setStatus("pending");
        requestId.current = crypto.randomUUID();
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to complete request. Retry to confirm whether the entry was saved."); }
    finally { setBusy(false); }
  }

  return <Dialog ref={dialog} aria-labelledby="admin-title" onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}>
    <button type="button" aria-label="Close admin section" disabled={busy} onClick={onClose} style={{ float: "right", border: 0, background: "transparent", color: "var(--puja-heading)" }}><X /></button>
    <h2 id="admin-title">{token ? entry ? "Edit contribution" : "Add contribution" : "Admin login"}</h2>
    <p>{token ? "Enter the contribution details below." : "Sign in with your admin user ID and password."}</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
        {!token ? <>
          <label>User ID<input autoFocus required autoComplete="username" value={userId} onChange={(e) => setUserId(e.target.value)} /></label>
          <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        </> : <>
          <label>Name<input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Mobile number (optional)<input type="tel" autoComplete="tel" maxLength={20} placeholder="10-digit number or +91" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} /></label>
          <label>Amount (INR)<input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label>Payment mode<select value={mode} onChange={(e) => setMode(e.target.value)}><option value="Cash">Cash</option><option value="Online">Online</option></select></label>
          {mode === "Online" && <div style={{ textAlign: "center", marginTop: 18, padding: 16, borderRadius: 14, background: "var(--puja-gold-soft)" }}>
            {validPaymentAmount && SITE_CONFIG.upiId ? <>
              <p style={{ marginTop: 0 }}>Scan to pay {paymentAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p>
              <QRCodeSVG value={upiLink} size={200} level="H" includeMargin title={`Pay INR ${paymentAmount.toFixed(2)} by UPI`} style={{ maxWidth: "100%", height: "auto" }} />
              <p style={{ fontSize: 12, marginBottom: 0 }}>Submit saves the entry. Scanning the QR does not confirm payment.</p>
            </> : <p>Enter a valid amount to display the payment QR code.</p>}
          </div>}
          <label>Status<select required value={status} onChange={(e) => setStatus(e.target.value)}><option value="" disabled>Select status</option><option value="done">Done</option><option value="pending">Pending</option></select></label>
        </>}
        <Submit type="submit">{busy ? "Please wait..." : token ? entry ? "Update contribution" : "Submit" : "Log in"}</Submit>
      </fieldset>
    </form>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    {success && <p role="status" style={{ color: "var(--puja-leaf)" }}>{success}</p>}
    {token && <Submit disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try { await onLogout(); setSuccess(""); }
      catch { setError("Unable to log out. Please try again."); }
      finally { setBusy(false); }
    }}>Log out</Submit>}
  </Dialog>;
}
