import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { REMIX_INSTANCE_ID, REMIX_APPLET_ID } from "./clientWorkspace";

const CHUNK_SIZE = 500000;
const memoryCache = new Map<string, string>();

// Remix-isolated IndexedDB for persistent caching & local storage
const IDB_NAME = `${REMIX_INSTANCE_ID}_FSDB_Cache`;

function getIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFromIDB(key: string): Promise<string | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readonly");
      const store = tx.objectStore("files");
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return null;
  }
}

async function saveToIDB(key: string, value: string): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      const store = tx.objectStore("files");
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    // Ignore
  }
}

export function transformGoogleDriveUrl(url: string): string {
  if (!url) return url;
  
  // Handle drive.google.com/file/d/ID/view format
  const match1 = url.match(/\/file\/d\/([^/]+)/);
  if (match1 && match1[1]) {
    return `https://drive.google.com/uc?export=download&id=${match1[1]}`;
  }
  
  // Handle drive.google.com/open?id=ID format
  const match2 = url.match(/id=([^&]+)/);
  if (url.includes('drive.google.com') && match2 && match2[1]) {
    return `https://drive.google.com/uc?export=download&id=${match2[1]}`;
  }
  
  return url;
}

/**
 * Uploads a file (base64) to remix-isolated storage.
 * Completely segregated from the official website:
 * 1. Generates unique remix-prefixed file IDs
 * 2. Saves to remix-isolated IndexedDB
 * 3. Saves to Express backend under remix folder
 * 4. Saves to Firestore under dedicated 'remix_fs_files' collection with remix metadata fields
 */
export async function uploadToFsdb(base64: string): Promise<string> {
  // Guaranteed non-overlapping file ID with remix prefix
  const fileId = `${REMIX_INSTANCE_ID}_file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const fileUrl = `fsdb://${fileId}`;
  
  try {
    await saveToIDB(fileUrl, base64);
    memoryCache.set(fileUrl, base64);
  } catch (err) {
    console.warn("Local storage to IndexedDB failed:", err);
  }
  
  // 1. Save to local Express backend server in remix-isolated directory
  try {
    console.log(`[uploadToFsdb] Syncing remix file ${fileId} to local Express backend...`);
    await fetch("/api/fsdb", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-remix-id": REMIX_INSTANCE_ID
      },
      body: JSON.stringify({ 
        fileId: fileId, 
        base64: base64,
        remixId: REMIX_INSTANCE_ID,
        appletId: REMIX_APPLET_ID
      })
    });
    console.log(`[uploadToFsdb] Successfully synced remix file to Express backend.`);
  } catch (backendErr) {
    console.warn("[uploadToFsdb] Failed to sync file to Express backend:", backendErr);
  }
  
  // 2. Save to Firestore in dedicated remix_fs_files collection in separate fields
  try {
    const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);
    const createdAt = new Date().toISOString();
    
    // Save each chunk under remix_fs_files
    for (let i = 0; i < totalChunks; i++) {
      const chunkData = base64.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await setDoc(doc(db, "remix_fs_files", `${fileId}_chunk_${i}`), {
        is_remix: true,
        remix_applet_id: REMIX_APPLET_ID,
        remix_instance_id: REMIX_INSTANCE_ID,
        fileId: fileId,
        index: i,
        data: chunkData,
        totalChunks: totalChunks,
        createdAt: createdAt
      });
    }
    console.log(`[uploadToFsdb] Saved ${totalChunks} chunks to remix_fs_files`);
  } catch (err) {
    console.warn("Failed to upload chunks to Firestore remix_fs_files:", err);
  }
  
  return fileUrl;
}

/**
 * Retrieves file from memory, remix-isolated IDB, Express backend, or Firestore remix_fs_files.
 */
export async function fetchFromFsdb(fileUrl: string): Promise<string> {
  if (!fileUrl) return fileUrl;
  if (!fileUrl.startsWith("fsdb://")) return transformGoogleDriveUrl(fileUrl);
  
  if (memoryCache.has(fileUrl)) {
    return memoryCache.get(fileUrl)!;
  }
  
  const idbCache = await getFromIDB(fileUrl);
  if (idbCache) {
    memoryCache.set(fileUrl, idbCache);
    return idbCache;
  }
  
  const fileId = fileUrl.replace("fsdb://", "");

  // 1. FIRST, try to fetch from local Express backend remix disk storage
  try {
    console.log(`[fetchFromFsdb] Attempting to fetch remix file ${fileId} from Express backend...`);
    const res = await fetch(`/api/fsdb/${fileId}?remix=${REMIX_INSTANCE_ID}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.base64) {
        console.log(`[fetchFromFsdb] Successfully retrieved file from Express backend.`);
        await saveToIDB(fileUrl, data.base64);
        memoryCache.set(fileUrl, data.base64);
        return data.base64;
      }
    }
  } catch (backendErr) {
    console.warn(`[fetchFromFsdb] Failed to fetch file from Express backend:`, backendErr);
  }
  
  // 2. SECOND, try to fetch from Cloud Firestore (check remix_fs_files first, then legacy fsFiles fallback)
  try {
    console.log(`[fetchFromFsdb] Falling back to fetch file ${fileId} from Cloud Firestore...`);
    
    // Check remix_fs_files first
    let collectionName = "remix_fs_files";
    let chunk0Doc = await getDoc(doc(db, collectionName, `${fileId}_chunk_0`));
    
    if (!chunk0Doc.exists()) {
      // Check legacy fsFiles if it was an earlier file
      collectionName = "fsFiles";
      chunk0Doc = await getDoc(doc(db, collectionName, `${fileId}_chunk_0`));
    }
    
    if (chunk0Doc.exists()) {
      const totalChunks = chunk0Doc.data().totalChunks;
      let fullBase64 = chunk0Doc.data().data;
      
      for (let i = 1; i < totalChunks; i++) {
        const chunkDoc = await getDoc(doc(db, collectionName, `${fileId}_chunk_${i}`));
        if (chunkDoc.exists()) {
          fullBase64 += chunkDoc.data().data;
        } else {
          console.warn(`Chunk ${i} missing for ${fileId}`);
          return "";
        }
      }
      
      if (fullBase64) {
        await saveToIDB(fileUrl, fullBase64);
        memoryCache.set(fileUrl, fullBase64);
        
        // Cache in backend
        try {
          fetch("/api/fsdb", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "x-remix-id": REMIX_INSTANCE_ID
            },
            body: JSON.stringify({ 
              fileId: fileId, 
              base64: fullBase64,
              remixId: REMIX_INSTANCE_ID 
            })
          });
        } catch {
          // ignore
        }
        
        return fullBase64;
      }
    }
  } catch (err) {
    console.warn(`[fetchFromFsdb] Firestore fetch failed for ${fileId}:`, err);
  }
  
  return "";
}

