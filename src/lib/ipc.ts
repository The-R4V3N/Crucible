import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Create a new PTY session. Returns the session ID. */
export async function ptyCreate(
  path: string,
  command?: string,
): Promise<string> {
  return invoke<string>("pty_create", { path, command });
}

/** Write data to a PTY session's stdin. */
export async function ptyWrite(
  sessionId: string,
  data: string,
): Promise<void> {
  return invoke("pty_write", { sessionId, data });
}

/** Resize a PTY session. */
export async function ptyResize(
  sessionId: string,
  rows: number,
  cols: number,
): Promise<void> {
  return invoke("pty_resize", { sessionId, rows, cols });
}

/** Kill a PTY session. */
export async function ptyKill(sessionId: string): Promise<void> {
  return invoke("pty_kill", { sessionId });
}

/** Payload emitted by the pty:output event. */
export interface PtyOutputPayload {
  session_id: string;
  data: string;
}

/** Payload emitted by the pty:exit event. */
export interface PtyExitPayload {
  session_id: string;
  code: number | null;
}

/** Listen for PTY output events. Returns an unlisten function. */
export async function onPtyOutput(
  callback: (payload: PtyOutputPayload) => void,
): Promise<UnlistenFn> {
  return listen<PtyOutputPayload>("pty:output", (event) => {
    callback(event.payload);
  });
}

/** Listen for PTY exit events. Returns an unlisten function. */
export async function onPtyExit(
  callback: (payload: PtyExitPayload) => void,
): Promise<UnlistenFn> {
  return listen<PtyExitPayload>("pty:exit", (event) => {
    callback(event.payload);
  });
}

// --- Config IPC ---

import type { WarpConfig } from "@/stores/configStore";

/** Load WARP configuration from disk. */
export async function configLoad(path?: string): Promise<WarpConfig> {
  return invoke<WarpConfig>("config_load", { path: path ?? null });
}

/** Save WARP configuration to disk. */
export async function configSave(
  config: WarpConfig,
  path?: string,
): Promise<void> {
  return invoke("config_save", { config, path: path ?? null });
}

// --- Git IPC ---

/** Git status for a project. */
export interface GitStatusInfo {
  branch: string;
  dirty: boolean;
  changed_files: number;
}

/** Get git status for a repository at the given path. */
export async function gitStatus(path: string): Promise<GitStatusInfo> {
  return invoke<GitStatusInfo>("git_status", { path });
}
