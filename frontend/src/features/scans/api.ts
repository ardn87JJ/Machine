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

export interface BusinessScores {
  money_score: number;
  attack_score: number;
  speed_cash_score: number;
  quality_gap_score: number;
  weak_competitor_score: number;
  upload_pressure_score: number;
  ecosystem_score: number;
  confidence: number;
}

export interface ScanAnalysis {
  model_version: string;
  opportunity_title: string;
  verdict: "GO" | "WATCH" | "SKIP";
  scores: BusinessScores;
  summary: string;
  evidence_video_ids: string[];
  competitor_channels: string[];
}

export interface ExecutionPlan {
  angle: string;
  first_test: string;
  criteria_go: string;
  notes: string;
}

export interface OpportunitySummary {
  id: string;
  scan_id: string;
  keyword: string;
  title: string;
  verdict: "GO" | "WATCH" | "SKIP";
  model_version: string;
  summary: string;
  scores: BusinessScores;
  evidence_video_ids: string[];
  competitor_channels: string[];
  execution_plan: ExecutionPlan;
  source: string;
  created_at: string;
  updated_at: string;
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

interface ListOpportunitiesResponse {
  opportunities: OpportunitySummary[];
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

export function getScanAnalysis(scanId: string) {
  return getJson<ScanAnalysis>(`/api/v1/scout/scans/${scanId}/analysis`);
}

export function listOpportunities() {
  return getJson<ListOpportunitiesResponse>("/api/v1/scout/opportunities");
}

export function runScoutWorkerOnce() {
  return postJson<Record<string, never>, RunScoutWorkerResponse>(
    "/api/v1/scout/worker/run-once",
    {},
  );
}
