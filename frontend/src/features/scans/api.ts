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

export interface ScanVideoSummary {
  rank: number;
  video_id: string;
  title: string;
  channel_id: string;
  channel_title: string;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  published_at: string | null;
  thumbnail_url: string | null;
}

interface ListScansResponse {
  scans: ScanSummary[];
}

interface CreateScanResponse {
  scan: ScanSummary;
}

interface ListScanVideosResponse {
  videos: ScanVideoSummary[];
}

interface RunScoutWorkerResponse {
  status: "no_job" | "completed" | "failed";
  job_id: string | null;
  scan_id: string | null;
  error_code: string | null;
  error_message: string | null;
}

export function listScans() {
  return getJson<ListScansResponse>("/api/v1/scout/scans");
}

export function createScan(keyword: string) {
  return postJson<{ keyword: string }, CreateScanResponse>("/api/v1/scout/scans", {
    keyword,
  });
}

export function listScanVideos(scanId: string) {
  return getJson<ListScanVideosResponse>(`/api/v1/scout/scans/${scanId}/videos`);
}

export function runScoutWorkerOnce() {
  return postJson<Record<string, never>, RunScoutWorkerResponse>(
    "/api/v1/scout/worker/run-once",
    {},
  );
}
