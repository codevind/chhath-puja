
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { RefreshCw, Users, Pencil } from "lucide-react";
import { SITE_CONFIG } from "../config";
import { Download } from "lucide-react";
import { generateReceipt } from "../utils/generateReceipt";


export type Contributor = {
  receiptId: string;
  name: string;
  date: string;
  time: string;
  amount: number;
  status: string;
  mobileNumber?: string;
  mode?: string;
};

const Container = styled.div`
  margin-top: 24px;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid var(--puja-border);
  border-radius: 14px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th {
    background: var(--puja-gold-soft);
    color: var(--puja-heading);
    padding: 14px;
    font-size: 13px;
  }

  td {
    padding: 14px;
    border-top: 1px solid var(--puja-border);
    font-size: 14px;
  }

  tbody tr:nth-child(even) {
    background: var(--puja-surface-soft);
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--puja-border);
  background: white;
  color: var(--puja-heading);
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
`;

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];

    if (char === '"') {
      if (inQuotes && csv[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !inQuotes
    ) {
      if (char === "\r" && csv[i + 1] === "\n") i++;

      row.push(field);
      field = "";

      if (row.some((value) => value.trim())) {
        rows.push(row);
      }

      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);

  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
}

function parseContributors(csv: string): Contributor[] {
  const rows = parseCsv(csv);

  if (rows.length === 0) return [];

  // Step 1: Initialize headers first
  const headers = rows[0].map((header) =>
    header.replace(/^\uFEFF/, "").trim().toLowerCase()
  );

  // Step 2: Get column indexes
  const receiptIdIndex = headers.indexOf("receipt id");
  const nameIndex = headers.indexOf("name");
  const dateIndex = headers.indexOf("date");
  const timeIndex = headers.indexOf("time");
  const amountIndex = headers.indexOf("amount");
  const statusIndex = headers.indexOf("status");
  const mobileIndex = headers.indexOf("mobile number");
  const modeIndex = headers.indexOf("mode");

  // Step 3: Validate required columns
  if (
    receiptIdIndex === -1 ||
    nameIndex === -1 ||
    dateIndex === -1 ||
    timeIndex === -1 ||
    amountIndex === -1
  ) {
    throw new Error(
      "Google Sheet must contain Receipt ID, Name, Date, Time and Amount columns."
    );
  }

  // Step 4: Convert CSV rows into contributor objects
  return rows
    .slice(1)
    .map((row) => ({
      receiptId: (row[receiptIdIndex] ?? "").trim(),
      name: (row[nameIndex] ?? "").trim(),
      date: (row[dateIndex] ?? "").trim(),
      time: (row[timeIndex] ?? "").trim(),
      amount: Number(
        (row[amountIndex] ?? "").replace(/[₹,\s]/g, "")
      ),
      status: (row[statusIndex] ?? "").trim().toLowerCase(),
      mobileNumber: (row[mobileIndex] ?? "").trim(),
      mode: (row[modeIndex] ?? "").trim(),
    }))
    .filter(
      (person) =>
        person.receiptId &&
        person.name &&
        Number.isFinite(person.amount) &&
        person.amount >= 0
    );
}



export default function Contributors({ isAdmin, onEdit, savedEntry }: {
  isAdmin: boolean;
  onEdit: (entry: Contributor) => void;
  savedEntry: Contributor | null;
}) {
  const [tab, setTab] = useState<"done" | "pending" | "verify">("done");
  // Keep confirmed edits visible while Google's published CSV catches up.
  const [confirmedEntries, setConfirmedEntries] = useState<Record<string, Contributor>>({});
  const [contributors, setContributors] = useState<
    Contributor[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchContributors = useCallback(async (
    initial = false
  ) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const url = SITE_CONFIG.contributorsSheetUrl;

      if (!url.startsWith("https://")) {
        throw new Error(
          "Configure contributorsSheetUrl in src/config.ts."
        );
      }

      const response = await fetch(url, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Unable to fetch contributors (${response.status}).`
        );
      }

      const csv = await response.text();
      const data = parseContributors(csv);

      setContributors(data);
      setConfirmedEntries((previous) => Object.fromEntries(Object.entries(previous).filter(([id, saved]) => {
        const current = data.find((entry) => entry.receiptId === id);
        return !current || current.name !== saved.name || current.amount !== saved.amount || current.status !== saved.status || (current.mobileNumber ?? "") !== (saved.mobileNumber ?? "") || (current.mode ?? "") !== (saved.mode ?? "");
      })));
      setError("");
    } catch (err) {
      console.error("Contributor fetch failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load contributors."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchContributors(true);

    const interval = window.setInterval(() => {
      void fetchContributors();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchContributors]);

  useEffect(() => {
    if (savedEntry) {
      setConfirmedEntries((previous) => ({ ...previous, [savedEntry.receiptId]: savedEntry }));
      setTab(savedEntry.status === "done" ? "done" : savedEntry.status === "verify" ? "verify" : "pending");
    }
  }, [savedEntry]);

  const entries = contributors.map((person) => confirmedEntries[person.receiptId] ?? person);
  for (const entry of Object.values(confirmedEntries)) {
    if (!entries.some((person) => person.receiptId === entry.receiptId)) entries.push(entry);
  }
  const statusTab = (status: string) => status === "done" ? "done" : status === "verify" ? "verify" : "pending";
  const tabLabels = { done: "Success", pending: "Pending", verify: "Under Verification" };
  const visibleEntries = entries.filter((person) => statusTab(person.status) === tab);
  const successfulEntries = entries.filter((person) => person.status === "done");

  const totalAmount = successfulEntries.reduce(
    (sum, person) => sum + person.amount,
    0
  );

  return (
    <Container>
      <div style={{
  padding: 20,
  background: "var(--puja-gold-soft)",
  borderRadius: 14,
  marginBottom: 20
}}>
  <div style={{ fontSize: 13, color: "var(--puja-muted)" }}>
    Total Successful Contributions
  </div>

  <div style={{
    fontSize: 30,
    fontWeight: 800,
    color: "var(--puja-heading)"
  }}>
    {totalAmount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    })}
  </div>

  <div style={{ fontSize: 12, color: "var(--puja-muted)" }}>
    From {successfulEntries.length} successful contributions
  </div>
</div>
      <Toolbar>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--puja-heading)",
            fontWeight: 700,
          }}
        >
          <Users size={19} />
          {visibleEntries.length} {tab === "done" ? "Successful" : tabLabels[tab]} Contributions
        </div>

        <RefreshButton
          onClick={() => void fetchContributors()}
          disabled={loading || refreshing}
        >
          <RefreshCw size={15} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </RefreshButton>
      </Toolbar>
      <div role="group" aria-label="Contribution status" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
        {(["done", "pending", "verify"] as const).map((value) => <RefreshButton key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} style={{ background: tab === value ? "var(--puja-gold-soft)" : "white", fontWeight: tab === value ? 700 : 400 }}>
          {tabLabels[value]} ({entries.filter((entry) => statusTab(entry.status) === value).length})
        </RefreshButton>)}
      </div>

      {error && (
        <p style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading contributors...</p>
      ) : visibleEntries.length === 0 ? (
        <p>{tab === "verify" ? "No contributions under verification yet." : `No ${tab === "done" ? "successful" : "pending"} contributions yet.`}</p>
      ) : (
        <TableWrap>
     

     <StyledTable>
  <thead>
    <tr>
      <th>Name</th>
      <th>Date</th>
      <th>Time</th>
      <th>Amount</th>
      {tab !== "done" && <th>Status</th>}
      {tab === "done" ? <th>Download Receipt</th> : isAdmin ? <th>Edit</th> : null}
    </tr>
  </thead>

  <tbody>
    {visibleEntries.map((person) => (
      <tr key={person.receiptId}>
        <td>{person.name}</td>
        <td>{person.date}</td>
        <td>{person.time}</td>

        <td>
          {person.amount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
        </td>

        {tab !== "done" && <td>{person.status === "verify" ? "Verify" : "Pending"}</td>}
        {tab === "done" ? <td>
          <button
            type="button"
            disabled={!person.receiptId}
            title="Download contribution receipt"
            aria-label={`Download receipt for ${person.name}`}
            onClick={async () => {
              try {
                await generateReceipt(person);
              } catch (error) {
                console.error(
                  "Receipt download failed:",
                  error
                );
                alert("Unable to generate receipt.");
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 12px",
              border: "1px solid var(--puja-border)",
              borderRadius: 10,
              background: "#fff9ee",
              color: "var(--puja-heading)",
              cursor: "pointer",
            }}
          >
            <Download size={17} />
            Download
          </button>
        </td> : isAdmin ? <td><RefreshButton type="button" aria-label={`Edit contribution for ${person.name}`} title="Edit contribution" onClick={() => onEdit(person)}><Pencil size={17} /></RefreshButton></td> : null}
      </tr>
    ))}
  </tbody>
</StyledTable>


        </TableWrap>
      )}

      <p
        style={{
          fontSize: 12,
          color: "var(--puja-muted)",
          marginTop: 14,
        }}
      >
        Data is sourced from Google Sheets and
        refreshed automatically every 30 seconds.
        Published Google Sheets data may be cached,
        so updates can take longer to appear.
      </p>
    </Container>
  );
}
