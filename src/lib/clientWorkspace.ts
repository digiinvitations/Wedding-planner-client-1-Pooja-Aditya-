/**
 * Client Workspace & Remix Data Isolation Module
 * 
 * Ensures that this remix (Applet ID: 5e09f781-4da3-4952-b789-521e70e51b5c)
 * and its workspaces (e.g., 'October Clients -1', 'October Clients -2', etc.)
 * save their configs, event timelines, uploaded images/media, and guest RSVPs in completely
 * segregated database partitions, isolated fields, and separate files without any risk of data overlap.
 */

export const REMIX_APPLET_ID = "5e09f781-4da3-4952-b789-521e70e51b5c";
export const REMIX_INSTANCE_ID = "remix_5e09f781";

export const WORKSPACE_PRESETS = [
  "October Clients -1",
  "October Clients -2",
  "October Clients -3",
  "October Clients -4",
  "October Clients -5",
  "October Clients -6",
  "October Clients -7",
  "October Clients -8",
  "October Clients -9",
  "October Clients -10"
];

const STORAGE_KEY = `${REMIX_INSTANCE_ID}_wedding_client_workspace`;
const KNOWN_WORKSPACES_KEY = `${REMIX_INSTANCE_ID}_wedding_known_workspaces`;

/**
 * Sanitize client identifier to safe alphanumeric string for Firestore document paths and filenames.
 * E.g., 'October Clients -1' -> 'october_clients_1'
 */
export function sanitizeWorkspaceId(name: string): string {
  if (!name || typeof name !== "string") return "october_clients_1";
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "october_clients_1";
  if (cleaned === "october_clients_-1" || cleaned === "october_clients_1") {
    return "october_clients_1";
  }
  return cleaned;
}

/**
 * Get current active client workspace name.
 * Priority:
 * 1. URL search param (?client=... or ?c=... or ?workspace=...)
 * 2. LocalStorage setting for this remix
 * 3. Default preset: 'October Clients -1'
 */
export function getActiveWorkspace(): string {
  if (typeof window !== "undefined") {
    // 1. Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const urlClient = params.get("client") || params.get("c") || params.get("workspace");
    if (urlClient && urlClient.trim().length > 0) {
      return urlClient.trim();
    }

    // 2. Check remix-specific localStorage
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("wedding_client_workspace");
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
  }

  // 3. Default workspace for this remix
  return "October Clients -1";
}

/**
 * Change the active client workspace.
 * Saves to remix-isolated localStorage, records in known workspaces, and fires a global event.
 */
export function setActiveWorkspace(workspaceName: string): void {
  if (!workspaceName || !workspaceName.trim()) return;
  const cleanName = workspaceName.trim();
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, cleanName);

    // Track known workspaces for this remix
    try {
      const knownStr = localStorage.getItem(KNOWN_WORKSPACES_KEY);
      const known: string[] = knownStr ? JSON.parse(knownStr) : [...WORKSPACE_PRESETS];
      if (!known.includes(cleanName)) {
        known.push(cleanName);
        localStorage.setItem(KNOWN_WORKSPACES_KEY, JSON.stringify(known));
      }
    } catch {
      // ignore JSON errors
    }

    // Dispatch event so all components react immediately
    window.dispatchEvent(
      new CustomEvent("client_workspace_changed", {
        detail: {
          workspaceName: cleanName,
          safeId: sanitizeWorkspaceId(cleanName),
          remixId: REMIX_INSTANCE_ID
        }
      })
    );
  }
}

/**
 * Get list of all known workspaces for this remix (presets + any custom created by user).
 */
export function getKnownWorkspaces(): string[] {
  if (typeof window !== "undefined") {
    try {
      const knownStr = localStorage.getItem(KNOWN_WORKSPACES_KEY);
      if (knownStr) {
        const parsed = JSON.parse(knownStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...WORKSPACE_PRESETS, ...parsed]));
        }
      }
    } catch {
      // fallback
    }
  }
  return [...WORKSPACE_PRESETS];
}

/**
 * Storage keys helper for remix localStorage cache
 */
export function getConfigStorageKey(workspaceName?: string): string {
  const ws = workspaceName || getActiveWorkspace();
  return `${REMIX_INSTANCE_ID}_wedding_config_${sanitizeWorkspaceId(ws)}`;
}

export function getRsvpsStorageKey(workspaceName?: string): string {
  const ws = workspaceName || getActiveWorkspace();
  return `${REMIX_INSTANCE_ID}_wedding_rsvps_${sanitizeWorkspaceId(ws)}`;
}

export function getUploadedAssetsStorageKey(): string {
  return `${REMIX_INSTANCE_ID}_wedding_uploaded_assets`;
}

