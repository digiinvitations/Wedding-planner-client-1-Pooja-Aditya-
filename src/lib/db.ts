import { WeddingConfig } from "../weddingConfig";
import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  getActiveWorkspace,
  sanitizeWorkspaceId,
  getConfigStorageKey,
  getRsvpsStorageKey,
  REMIX_APPLET_ID,
  REMIX_INSTANCE_ID
} from "./clientWorkspace";

// Interface for RSVP database record
export interface RSVPRecord {
  id: string;
  name: string;
  phone: string;
  guestsCount: number;
  attend: boolean;
  message: string;
  timestamp: string;
  clientWorkspace?: string;
  isRemix?: boolean;
  remixAppletId?: string;
  remixInstanceId?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let authInfoObj = {};
  try {
    const auth = getAuth();
    authInfoObj = {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    };
  } catch (e) {
    console.warn("Auth not initialized, skipping auth info in error");
  }
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: authInfoObj,
    operationType,
    path
  };
  
  console.warn('[Firebase] Firestore Error Trace:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// 1. Config Operations - Partitioned by Remix & Client Workspace with separate fields
export async function saveConfigToDb(newConfig: WeddingConfig, targetWorkspace?: string) {
  const workspace = targetWorkspace || newConfig.clientWorkspace || getActiveWorkspace();
  const safeId = sanitizeWorkspaceId(workspace);
  const now = new Date().toISOString();
  
  const configWithWorkspace: WeddingConfig = {
    ...newConfig,
    clientWorkspace: workspace
  };

  console.log(`[saveConfigToDb] Saving remix config for workspace: "${workspace}" (safeId: ${safeId}, remix: ${REMIX_INSTANCE_ID})...`);
  
  // 1. Save locally to remix-specific storage and default key for fast UI update
  try {
    localStorage.setItem(getConfigStorageKey(workspace), JSON.stringify(configWithWorkspace));
    localStorage.setItem("wedding_config", JSON.stringify(configWithWorkspace));
    window.dispatchEvent(new Event("wedding_config_updated"));
  } catch (storageErr) {
    console.warn("[saveConfigToDb] LocalStorage error:", storageErr);
  }
  
  // 2. Sync config to local Express backend server (under remix partition)
  try {
    console.log(`[saveConfigToDb] Syncing config to Express backend for remix "${REMIX_INSTANCE_ID}" client "${workspace}"...`);
    await fetch(`/api/config?client=${encodeURIComponent(workspace)}&remix=${encodeURIComponent(REMIX_INSTANCE_ID)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": safeId,
        "x-remix-id": REMIX_INSTANCE_ID,
        "x-applet-id": REMIX_APPLET_ID
      },
      body: JSON.stringify(configWithWorkspace)
    });
    console.log("[saveConfigToDb] Successfully synced remix config to local Express backend.");
  } catch (backendErr) {
    console.warn("[saveConfigToDb] Failed to save config to backend server:", backendErr);
  }

  // 3. Save to Cloud Firestore in segregated remix-only collections and fields
  // Never touches official website's website/permanent_data or settings/config
  const remixDocPath = `remix_websites/${REMIX_INSTANCE_ID}/workspaces/${safeId}`;
  try {
    console.log(`[saveConfigToDb] Saving to Firestore dedicated remix path (${remixDocPath})...`);
    
    // Dedicated remix payload with explicit separate remix fields
    const remixPayload = {
      is_remix: true,
      remix_applet_id: REMIX_APPLET_ID,
      remix_instance_id: REMIX_INSTANCE_ID,
      remix_client_workspace: workspace,
      remix_safe_id: safeId,
      remix_wedding_config: configWithWorkspace,
      remix_updated_at: now,
      data: configWithWorkspace,
      workspaceName: workspace,
      updatedAt: now
    };

    // Save to isolated remix collection path
    await setDoc(doc(db, "remix_websites", REMIX_INSTANCE_ID, "workspaces", safeId), remixPayload);

    // Save remix profile metadata
    await setDoc(doc(db, "remix_websites", REMIX_INSTANCE_ID), {
      remix_applet_id: REMIX_APPLET_ID,
      remix_instance_id: REMIX_INSTANCE_ID,
      activeWorkspace: workspace,
      updatedAt: now
    }, { merge: true });

    // Also mirror to dedicated remix_wedding_clients partition
    await setDoc(doc(db, "remix_wedding_clients", `${REMIX_INSTANCE_ID}_${safeId}`), remixPayload);

    console.log(`[saveConfigToDb] Successfully saved to Firestore remix partition: ${REMIX_INSTANCE_ID}_${safeId}`);
  } catch (err) {
    console.warn("[saveConfigToDb] Failed to save config to Firestore remix partition:", err);
    handleFirestoreError(err, OperationType.WRITE, remixDocPath);
  }
}

// Helper to fetch config from remix partition
export async function fetchConfigFromDb(targetWorkspace?: string): Promise<WeddingConfig | null> {
  const workspace = targetWorkspace || getActiveWorkspace();
  const safeId = sanitizeWorkspaceId(workspace);
  console.log(`[fetchConfigFromDb] Fetching remix config for workspace: "${workspace}" (safeId: ${safeId}, remix: ${REMIX_INSTANCE_ID})...`);

  const isLegacyOrMismatched = (cfg: any) => {
    if (!cfg || typeof cfg !== "object") return true;
    const str = JSON.stringify(cfg);
    if (/tishi|trishi|hitakshi|devendra|pradeep/i.test(str)) return true;
    if (cfg.groom?.name && !cfg.groom.name.includes("Aditya")) return true;
    if (cfg.bride?.name && !cfg.bride.name.includes("Pooja")) return true;
    return false;
  };

  // 1. Try dedicated remix partition in Firestore
  try {
    const remixDocSnap = await getDoc(doc(db, "remix_websites", REMIX_INSTANCE_ID, "workspaces", safeId));
    if (remixDocSnap.exists()) {
      const docData = remixDocSnap.data();
      const serverConfig = (docData.remix_wedding_config || docData.data) as WeddingConfig;
      if (serverConfig && Object.keys(serverConfig).length > 0) {
        if (isLegacyOrMismatched(serverConfig)) {
          console.warn(`[fetchConfigFromDb] Discarded obsolete config with legacy names from ${safeId}`);
        } else {
          console.log(`[fetchConfigFromDb] Found config in remix_websites/${REMIX_INSTANCE_ID}/workspaces/${safeId}`);
          localStorage.setItem(getConfigStorageKey(workspace), JSON.stringify(serverConfig));
          localStorage.setItem("wedding_config", JSON.stringify(serverConfig));
          window.dispatchEvent(new Event("wedding_config_updated"));
          return serverConfig;
        }
      }
    }

    const altRemixSnap = await getDoc(doc(db, "remix_wedding_clients", `${REMIX_INSTANCE_ID}_${safeId}`));
    if (altRemixSnap.exists()) {
      const docData = altRemixSnap.data();
      const serverConfig = (docData.remix_wedding_config || docData.data) as WeddingConfig;
      if (serverConfig && Object.keys(serverConfig).length > 0) {
        if (isLegacyOrMismatched(serverConfig)) {
          console.warn(`[fetchConfigFromDb] Discarded obsolete config with legacy names from ${REMIX_INSTANCE_ID}_${safeId}`);
        } else {
          console.log(`[fetchConfigFromDb] Found config in remix_wedding_clients/${REMIX_INSTANCE_ID}_${safeId}`);
          localStorage.setItem(getConfigStorageKey(workspace), JSON.stringify(serverConfig));
          localStorage.setItem("wedding_config", JSON.stringify(serverConfig));
          window.dispatchEvent(new Event("wedding_config_updated"));
          return serverConfig;
        }
      }
    }
  } catch (err) {
    console.warn(`[fetchConfigFromDb] Firestore remix check failed for ${safeId}:`, err);
  }

  // 2. Check local Express backend remix partition
  try {
    console.log(`[fetchConfigFromDb] Checking Express backend for remix "${REMIX_INSTANCE_ID}" client "${workspace}"...`);
    const res = await fetch(`/api/config?client=${encodeURIComponent(workspace)}&remix=${encodeURIComponent(REMIX_INSTANCE_ID)}`);
    if (res.ok) {
      const serverConfig = await res.json();
      if (serverConfig && Object.keys(serverConfig).length > 0) {
        if (isLegacyOrMismatched(serverConfig)) {
          console.warn("[fetchConfigFromDb] Discarded backend config with legacy names");
        } else {
          console.log(`[fetchConfigFromDb] Config found on Express backend remix partition for client "${workspace}".`);
          localStorage.setItem(getConfigStorageKey(workspace), JSON.stringify(serverConfig));
          localStorage.setItem("wedding_config", JSON.stringify(serverConfig));
          window.dispatchEvent(new Event("wedding_config_updated"));
          return serverConfig;
        }
      }
    }
  } catch (fallbackErr) {
    console.warn("[fetchConfigFromDb] Failed to fetch from backend server remix partition:", fallbackErr);
  }

  // 3. Isolated: Return null so local default bundled template is loaded without touching official site data
  console.log("[fetchConfigFromDb] No saved config found for this remix workspace. Using local defaults.");
  return null;
}

// 2. RSVP Operations - Partitioned by Remix & Client Workspace
export async function addRsvpToDb(newRsvp: Omit<RSVPRecord, "id">, targetWorkspace?: string): Promise<RSVPRecord> {
  const workspace = targetWorkspace || getActiveWorkspace();
  const safeId = sanitizeWorkspaceId(workspace);
  let record: RSVPRecord;
  const timestamp = new Date().toISOString();
  
  // 1. Attempt to save to Cloud Firestore dedicated remix collection
  try {
    const rsvpsRef = collection(db, "remix_websites", REMIX_INSTANCE_ID, "workspaces", safeId, "rsvps");
    const rsvpData = {
      ...newRsvp,
      is_remix: true,
      remix_applet_id: REMIX_APPLET_ID,
      remix_instance_id: REMIX_INSTANCE_ID,
      clientWorkspace: workspace,
      timestamp: timestamp
    };

    const docRef = await addDoc(rsvpsRef, rsvpData);
    
    // Also mirror to remix_rsvps collection for indexed queries
    try {
      await setDoc(doc(db, "remix_rsvps", docRef.id), rsvpData);
    } catch {
      // ignore mirror error
    }

    record = { 
      id: docRef.id, 
      ...newRsvp, 
      clientWorkspace: workspace, 
      timestamp: timestamp,
      isRemix: true,
      remixAppletId: REMIX_APPLET_ID,
      remixInstanceId: REMIX_INSTANCE_ID
    };
    console.log(`[addRsvpToDb] Saved RSVP to Firestore under remix_websites/${REMIX_INSTANCE_ID}/workspaces/${safeId}/rsvps/${docRef.id}`);
  } catch (err) {
    console.warn("Save RSVP to Firestore remix partition failed, generating local ID:", err);
    const id = `${REMIX_INSTANCE_ID}_rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    record = { 
      id, 
      ...newRsvp, 
      clientWorkspace: workspace, 
      timestamp: timestamp,
      isRemix: true,
      remixAppletId: REMIX_APPLET_ID,
      remixInstanceId: REMIX_INSTANCE_ID
    };
  }

  // 2. Sync to Express backend server in remix client folder
  try {
    console.log(`[addRsvpToDb] Syncing RSVP to backend server for remix "${REMIX_INSTANCE_ID}" client "${workspace}"...`);
    await fetch(`/api/rsvps?client=${encodeURIComponent(workspace)}&remix=${encodeURIComponent(REMIX_INSTANCE_ID)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": safeId,
        "x-remix-id": REMIX_INSTANCE_ID,
        "x-applet-id": REMIX_APPLET_ID
      },
      body: JSON.stringify(record)
    });
    console.log("[addRsvpToDb] Successfully synced RSVP to backend server remix partition.");
  } catch (backendErr) {
    console.warn("[addRsvpToDb] Failed to sync RSVP to backend server:", backendErr);
  }

  // 3. Update local cache
  const rsvps = getLocalRsvps(workspace);
  const filtered = rsvps.filter(r => r.id !== record.id);
  filtered.unshift(record);
  localStorage.setItem(getRsvpsStorageKey(workspace), JSON.stringify(filtered));
  localStorage.setItem("wedding_rsvps", JSON.stringify(filtered));
  window.dispatchEvent(new Event("storage_rsvps_updated"));
  return record;
}

export function getLocalRsvps(targetWorkspace?: string): RSVPRecord[] {
  const workspace = targetWorkspace || getActiveWorkspace();
  try {
    const raw = localStorage.getItem(getRsvpsStorageKey(workspace)) || localStorage.getItem("wedding_rsvps");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Fetch all RSVPs for this remix workspace
export async function fetchRsvpsFromDb(targetWorkspace?: string): Promise<RSVPRecord[]> {
  const workspace = targetWorkspace || getActiveWorkspace();
  const safeId = sanitizeWorkspaceId(workspace);
  
  // 1. Attempt to fetch from Firestore dedicated remix partition
  try {
    const rsvpsPath = collection(db, "remix_websites", REMIX_INSTANCE_ID, "workspaces", safeId, "rsvps");
    const querySnapshot = await getDocs(rsvpsPath);
    const data: RSVPRecord[] = [];
    querySnapshot.forEach((d) => {
      data.push({ id: d.id, ...d.data() } as RSVPRecord);
    });
    
    if (data.length > 0) {
      localStorage.setItem(getRsvpsStorageKey(workspace), JSON.stringify(data));
      localStorage.setItem("wedding_rsvps", JSON.stringify(data));
      window.dispatchEvent(new Event("storage_rsvps_updated"));
      return data;
    }
  } catch (err) {
    console.warn(`Failed to fetch RSVPs from Firestore remix partition:`, err);
  }

  // 2. Fallback to Express backend server for this remix client
  try {
    console.log(`[fetchRsvpsFromDb] Checking Express backend for RSVPs of remix "${REMIX_INSTANCE_ID}" client "${workspace}"...`);
    const res = await fetch(`/api/rsvps?client=${encodeURIComponent(workspace)}&remix=${encodeURIComponent(REMIX_INSTANCE_ID)}`);
    if (res.ok) {
      const serverRsvps = await res.json();
      if (Array.isArray(serverRsvps)) {
        console.log(`[fetchRsvpsFromDb] Loaded ${serverRsvps.length} RSVPs for remix client "${workspace}".`);
        localStorage.setItem(getRsvpsStorageKey(workspace), JSON.stringify(serverRsvps));
        localStorage.setItem("wedding_rsvps", JSON.stringify(serverRsvps));
        window.dispatchEvent(new Event("storage_rsvps_updated"));
        return serverRsvps;
      }
    }
  } catch (fallbackErr) {
    console.warn("[fetchRsvpsFromDb] Failed to fetch RSVPs from backend server:", fallbackErr);
  }

  return getLocalRsvps(workspace);
}

export async function deleteLocalRsvp(id: string, targetWorkspace?: string) {
  const workspace = targetWorkspace || getActiveWorkspace();
  const safeId = sanitizeWorkspaceId(workspace);

  // 1. Delete from Firestore remix partition
  try {
    await deleteDoc(doc(db, "remix_websites", REMIX_INSTANCE_ID, "workspaces", safeId, "rsvps", id));
    await deleteDoc(doc(db, "remix_rsvps", id));
  } catch (err) {
    console.warn("Failed to delete RSVP on Firestore remix partition:", err);
  }

  // 2. Delete from Express backend server remix partition
  try {
    await fetch(`/api/rsvps/${id}?client=${encodeURIComponent(workspace)}&remix=${encodeURIComponent(REMIX_INSTANCE_ID)}`, {
      method: "DELETE",
      headers: { 
        "x-client-id": safeId,
        "x-remix-id": REMIX_INSTANCE_ID
      }
    });
  } catch (backendErr) {
    console.warn("[deleteLocalRsvp] Failed to delete RSVP on backend server remix partition:", backendErr);
  }

  // 3. Update local cache
  const rsvps = getLocalRsvps(workspace);
  const filtered = rsvps.filter(r => r.id !== id);
  localStorage.setItem(getRsvpsStorageKey(workspace), JSON.stringify(filtered));
  localStorage.setItem("wedding_rsvps", JSON.stringify(filtered));
  window.dispatchEvent(new Event("storage_rsvps_updated"));
}

export async function clearAllLocalRsvps(targetWorkspace?: string) {
  const workspace = targetWorkspace || getActiveWorkspace();
  const safeId = sanitizeWorkspaceId(workspace);

  // 1. Clear from Firestore remix partition
  try {
    const querySnapshot = await getDocs(collection(db, "remix_websites", REMIX_INSTANCE_ID, "workspaces", safeId, "rsvps"));
    const deletePromises = querySnapshot.docs.map(document => 
      deleteDoc(doc(db, "remix_websites", REMIX_INSTANCE_ID, "workspaces", safeId, "rsvps", document.id))
    );
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn("Failed to clear all RSVPs on Firestore remix partition:", err);
  }

  // 2. Clear from Express backend server remix partition
  try {
    await fetch(`/api/rsvps?client=${encodeURIComponent(workspace)}&remix=${encodeURIComponent(REMIX_INSTANCE_ID)}`, {
      method: "DELETE",
      headers: { 
        "x-client-id": safeId,
        "x-remix-id": REMIX_INSTANCE_ID
      }
    });
  } catch (backendErr) {
    console.warn("[clearAllLocalRsvps] Failed to clear RSVPs on backend server remix partition:", backendErr);
  }

  // 3. Update local cache
  localStorage.removeItem(getRsvpsStorageKey(workspace));
  localStorage.removeItem("wedding_rsvps");
  window.dispatchEvent(new Event("storage_rsvps_updated"));
}

// 3. Upload File Chunk (FSDB Placeholder)
export async function uploadChunkToDb() {
  // No-op
}

// 4. Fetch File Chunks (FSDB Placeholder)
export async function fetchChunksFromDb() {
  return "";
}

