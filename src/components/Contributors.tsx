
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { RefreshCw, Users } from "lucide-react";
import { SITE_CONFIG } from "../config";
import { Download } from "lucide-react";
import { generateReceipt } from "../utils/generateReceipt";


type Contributor = {
  receiptId: string;
  name: string;
  date: string;
  time: string;
  amount: number;
};

const Container = styled.div`
  margin-top: 24px;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #ead6b9;
  border-radius: 14px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th {
    background: #fff0d8;
    color: #713d20;
    padding: 14px;
    font-size: 13px;
  }

  td {
    padding: 14px;
    border-top: 1px solid #f0e5d6;
    font-size: 14px;
  }

  tbody tr:nth-child(even) {
    background: #fffbf5;
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
  border: 1px solid #ead6b9;
  background: white;
  color: #713d20;
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
    }))
    .filter(
      (person) =>
        person.receiptId &&
        person.name &&
        Number.isFinite(person.amount) &&
        person.amount >= 0
    );
}



export default function Contributors() {
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

  const totalAmount = contributors.reduce(
    (sum, person) => sum + person.amount,
    0
  );

  return (
    <Container>
      <div style={{
  padding: 20,
  background: "#fff0d8",
  borderRadius: 14,
  marginBottom: 20
}}>
  <div style={{ fontSize: 13, color: "#8a5a30" }}>
    Total Contributions
  </div>

  <div style={{
    fontSize: 30,
    fontWeight: 800,
    color: "#713d20"
  }}>
    {totalAmount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    })}
  </div>

  <div style={{ fontSize: 12, color: "#8a7058" }}>
    From {contributors.length} contributors
  </div>
</div>
      <Toolbar>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#713d20",
            fontWeight: 700,
          }}
        >
          <Users size={19} />
          {contributors.length} Contributors
        </div>

        <RefreshButton
          onClick={() => void fetchContributors()}
          disabled={loading || refreshing}
        >
          <RefreshCw size={15} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </RefreshButton>
      </Toolbar>

      {error && (
        <p style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading contributors...</p>
      ) : contributors.length === 0 ? (
        <p>No contributors have been listed yet.</p>
      ) : (
        <TableWrap>
     

     <StyledTable>
  <thead>
    <tr>
      <th>Name</th>
      <th>Date</th>
      <th>Time</th>
      <th>Amount</th>
      <th>Download Receipt</th>
    </tr>
  </thead>

  <tbody>
    {contributors.map((person) => (
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

        <td>
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
              border: "1px solid #e1c7a4",
              borderRadius: 10,
              background: "#fff9ee",
              color: "#713d20",
              cursor: "pointer",
            }}
          >
            <Download size={17} />
            Download
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</StyledTable>


        </TableWrap>
      )}

      <p
        style={{
          fontSize: 12,
          color: "#90765e",
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
