import { getJson } from "../../lib/api";

export interface SystemStatus {
  name: string;
  environment: string;
  status: "ok";
  version: string;
}

export function getSystemStatus(): Promise<SystemStatus> {
  return getJson<SystemStatus>("/api/v1/status");
}
