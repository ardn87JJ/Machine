import { getJson, postJson } from "../../lib/api";

export type ScanStatus =
  | "queued"
  | "running"
  | "cancel_requested"
  | "cancelled"
  | "completed"
  | "failed";

export interface ScanSummary {
  id: string;
  platform: "youtube";
  keyword: string;
  status: ScanStatus;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface ListScansResponse {
  scans: ScanSummary[];
}

interface CreateScanResponse {
  scan: ScanSummary;
}

export function listScans() {
  return getJson<ListScansResponse>("/api/v1/scout/scans");
}

export function createScan(keyword: string) {
  return postJson<{ keyword: string }, CreateScanResponse>("/api/v1/scout/scans", {
    keyword,
  });
}
