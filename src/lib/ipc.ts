import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Create a new PTY session. Returns the session ID. */
export async function ptyCreate(path: string, command?: string): Promise<string> {
  return invoke<string>("pty_create", { path, command });
}

/** Write data to a PTY session's stdin. */
export async function ptyWrite(sessionId: string, data: string): Promise<void> {
  return invoke("pty_write", { sessionId, data });
}

/** Resize a PTY session. */
export async function ptyResize(sessionId: string, rows: number, cols: number): Promise<void> {
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

/** Payload emitted by the pty:attention event. */
export interface PtyAttentionPayload {
  session_id: string;
  needs_attention: boolean;
}

/** Listen for PTY attention events. Returns an unlisten function. */
export async function onPtyAttention(
  callback: (payload: PtyAttentionPayload) => void,
): Promise<UnlistenFn> {
  return listen<PtyAttentionPayload>("pty:attention", (event) => {
    callback(event.payload);
  });
}

/** Listen for PTY exit events. Returns an unlisten function. */
export async function onPtyExit(callback: (payload: PtyExitPayload) => void): Promise<UnlistenFn> {
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
export async function configSave(config: WarpConfig, path?: string): Promise<void> {
  return invoke("config_save", { config, path: path ?? null });
}

// --- Git IPC ---

/** Git status for a project. */
export interface GitStatusInfo {
  branch: string;
  dirty: boolean;
  changed_files: number;
  changed_file_paths: string[];
}

/** Get git status for a repository at the given path. */
export async function gitStatus(path: string): Promise<GitStatusInfo> {
  return invoke<GitStatusInfo>("git_status", { path });
}

/** File diff result. */
export interface FileDiffInfo {
  path: string;
  old_content: string;
  new_content: string;
}

/** Get the diff for a file in the working directory vs HEAD. */
export async function gitDiff(repoPath: string, filePath: string): Promise<FileDiffInfo> {
  return invoke<FileDiffInfo>("git_diff", { repoPath, filePath });
}

// --- File IPC ---

/** A node in the file tree. */
export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children: FileNode[];
}

/** File change event payload. */
export interface FileChangedPayload {
  path: string;
  kind: string;
}

/** Get the file tree for a directory. */
export async function fileTree(path: string, maxDepth?: number): Promise<FileNode> {
  return invoke<FileNode>("file_tree", { path, maxDepth: maxDepth ?? null });
}

/** Read a file's contents. */
export async function fileRead(path: string): Promise<string> {
  return invoke<string>("file_read", { path });
}

/** Write content to a file. */
export async function fileWrite(path: string, content: string): Promise<void> {
  return invoke("file_write", { path, content });
}

/** Start watching a directory for file changes. */
export async function fileWatchStart(path: string): Promise<void> {
  return invoke("file_watch_start", { path });
}

/** A search result match. */
export interface SearchMatchResult {
  path: string;
  line: number;
  content: string;
}

/** Search for a pattern in project files. */
export async function fileSearch(
  path: string,
  query: string,
  maxResults?: number,
): Promise<SearchMatchResult[]> {
  return invoke<SearchMatchResult[]>("file_search", {
    path,
    query,
    maxResults: maxResults ?? null,
  });
}

/** Listen for file change events. Returns an unlisten function. */
export async function onFileChanged(
  callback: (payload: FileChangedPayload) => void,
): Promise<UnlistenFn> {
  return listen<FileChangedPayload>("file:changed", (event) => {
    callback(event.payload);
  });
}
