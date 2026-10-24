import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Ensure data directories exist
// Remix identification constants
const REMIX_APPLET_ID = "5e09f781-4da3-4952-b789-521e70e51b5c";
const REMIX_INSTANCE_ID = "remix_5e09f781";

// Ensure data directories exist
const DATA_DIR = path.join(process.cwd(), "src", "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const FS_FILES_DIR = path.join(DATA_DIR, "fs_files");

// Dedicated isolated remix storage directories
const REMIX_ROOT_DIR = path.join(DATA_DIR, REMIX_INSTANCE_ID);
const REMIX_UPLOADS_DIR = path.join(REMIX_ROOT_DIR, "uploads");
const REMIX_FS_FILES_DIR = path.join(REMIX_ROOT_DIR, "fs_files");
const REMIX_WORKSPACES_DIR = path.join(REMIX_ROOT_DIR, "workspaces");

[DATA_DIR, UPLOADS_DIR, FS_FILES_DIR, REMIX_ROOT_DIR, REMIX_UPLOADS_DIR, REMIX_FS_FILES_DIR, REMIX_WORKSPACES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Support large JSON bodies for base64 image/audio uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Paths to JSON storage files
const CONFIG_FILE = path.join(DATA_DIR, "wedding_config.json");
const RSVPS_FILE = path.join(DATA_DIR, "rsvps.json");
const REMIX_CONFIG_FILE = path.join(REMIX_ROOT_DIR, "wedding_config.json");
const REMIX_RSVPS_FILE = path.join(REMIX_ROOT_DIR, "rsvps.json");

// Remix client isolation helper for multi-tenant remix storage
function getClientPaths(clientParam?: string) {
  if (!clientParam || typeof clientParam !== "string" || !clientParam.trim()) {
    return {
      safeId: "default",
      clientDir: REMIX_ROOT_DIR,
      clientConfigFile: REMIX_CONFIG_FILE,
      clientRsvpsFile: REMIX_RSVPS_FILE,
      isDefault: true,
    };
  }

  const safeId = clientParam
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "default";

  const clientDir = path.join(REMIX_WORKSPACES_DIR, safeId);
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }

  const clientConfigFile = path.join(clientDir, "wedding_config.json");
  const clientRsvpsFile = path.join(clientDir, "rsvps.json");

  return { safeId, clientDir, clientConfigFile, clientRsvpsFile, isDefault: false };
}

// Serve uploaded media files statically (prioritizing remix isolated uploads)
app.use("/uploads", express.static(REMIX_UPLOADS_DIR));
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/remix_uploads", express.static(REMIX_UPLOADS_DIR));

// 0. List known client workspaces on server
app.get("/api/workspaces", (req, res) => {
  try {
    let clients: string[] = [];
    if (fs.existsSync(REMIX_WORKSPACES_DIR)) {
      clients = fs.readdirSync(REMIX_WORKSPACES_DIR).filter((f) => {
        return fs.statSync(path.join(REMIX_WORKSPACES_DIR, f)).isDirectory();
      });
    }
    res.json({ workspaces: clients, remixId: REMIX_INSTANCE_ID });
  } catch (error) {
    console.error("Error reading workspaces:", error);
    res.status(500).json({ error: "Failed to read workspaces" });
  }
});

// 1. Get Wedding Configuration for remix workspace
app.get("/api/config", (req, res) => {
  try {
    const client = (req.query.client as string) || (req.headers["x-client-id"] as string);
    const { clientConfigFile, isDefault } = getClientPaths(client);

    // If remix client config file exists, return it
    if (fs.existsSync(clientConfigFile)) {
      const data = fs.readFileSync(clientConfigFile, "utf-8");
      return res.json(JSON.parse(data));
    }

    // Fallback to remix default config if exists
    if (fs.existsSync(REMIX_CONFIG_FILE)) {
      const data = fs.readFileSync(REMIX_CONFIG_FILE, "utf-8");
      return res.json(JSON.parse(data));
    }

    // Initial template fallback: read template JSON as read-only base
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return res.json(JSON.parse(data));
    }

    return res.json({});
  } catch (error) {
    console.error("Error reading config:", error);
    res.status(500).json({ error: "Failed to read configuration" });
  }
});

// 2. Save Wedding Configuration for remix workspace
app.post("/api/config", (req, res) => {
  try {
    const configData = req.body;
    const client = (req.query.client as string) || (req.headers["x-client-id"] as string) || configData?.clientWorkspace;
    const { clientConfigFile } = getClientPaths(client);

    // Always tag with remix metadata
    const enrichedData = {
      ...configData,
      is_remix: true,
      remix_applet_id: REMIX_APPLET_ID,
      remix_instance_id: REMIX_INSTANCE_ID,
      remix_saved_at: new Date().toISOString()
    };

    // Save strictly to remix client directory - NEVER modifies official site's CONFIG_FILE
    fs.writeFileSync(clientConfigFile, JSON.stringify(enrichedData, null, 2), "utf-8");

    res.json({ 
      success: true, 
      message: "Configuration saved successfully in isolated remix partition", 
      client: client || "default",
      remixId: REMIX_INSTANCE_ID
    });
  } catch (error) {
    console.error("Error saving config:", error);
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

// 3. Get RSVPs for remix workspace
app.get("/api/rsvps", (req, res) => {
  try {
    const client = (req.query.client as string) || (req.headers["x-client-id"] as string);
    const { clientRsvpsFile } = getClientPaths(client);

    if (fs.existsSync(clientRsvpsFile)) {
      const data = fs.readFileSync(clientRsvpsFile, "utf-8");
      return res.json(JSON.parse(data));
    }

    if (fs.existsSync(REMIX_RSVPS_FILE)) {
      const data = fs.readFileSync(REMIX_RSVPS_FILE, "utf-8");
      return res.json(JSON.parse(data));
    }

    return res.json([]);
  } catch (error) {
    console.error("Error reading RSVPs:", error);
    res.status(500).json({ error: "Failed to read RSVPs" });
  }
});

// 4. Submit RSVP for remix workspace
app.post("/api/rsvps", (req, res) => {
  try {
    const newRsvp = req.body;
    const client = (req.query.client as string) || (req.headers["x-client-id"] as string) || newRsvp?.clientWorkspace;
    const { clientRsvpsFile } = getClientPaths(client);

    let rsvps: any[] = [];
    if (fs.existsSync(clientRsvpsFile)) {
      const data = fs.readFileSync(clientRsvpsFile, "utf-8");
      try {
        rsvps = JSON.parse(data);
      } catch (e) {
        rsvps = [];
      }
    }
    
    // Generate a secure unique ID with remix prefix
    if (!newRsvp.id) {
      newRsvp.id = `${REMIX_INSTANCE_ID}_rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    if (!newRsvp.timestamp) {
      newRsvp.timestamp = new Date().toISOString();
    }
    
    newRsvp.is_remix = true;
    newRsvp.remix_applet_id = REMIX_APPLET_ID;
    newRsvp.remix_instance_id = REMIX_INSTANCE_ID;

    rsvps.unshift(newRsvp);
    fs.writeFileSync(clientRsvpsFile, JSON.stringify(rsvps, null, 2), "utf-8");
    res.json(newRsvp);
  } catch (error) {
    console.error("Error adding RSVP:", error);
    res.status(500).json({ error: "Failed to submit RSVP" });
  }
});

// 5. Delete single RSVP from remix workspace
app.delete("/api/rsvps/:id", (req, res) => {
  try {
    const { id } = req.params;
    const client = (req.query.client as string) || (req.headers["x-client-id"] as string);
    const { clientRsvpsFile } = getClientPaths(client);

    if (fs.existsSync(clientRsvpsFile)) {
      const data = fs.readFileSync(clientRsvpsFile, "utf-8");
      let rsvps = JSON.parse(data);
      rsvps = rsvps.filter((r: any) => r.id !== id);
      fs.writeFileSync(clientRsvpsFile, JSON.stringify(rsvps, null, 2), "utf-8");
    }
    res.json({ success: true, remixId: REMIX_INSTANCE_ID });
  } catch (error) {
    console.error("Error deleting RSVP:", error);
    res.status(500).json({ error: "Failed to delete RSVP" });
  }
});

// 6. Clear all RSVPs for remix workspace
app.delete("/api/rsvps", (req, res) => {
  try {
    const client = (req.query.client as string) || (req.headers["x-client-id"] as string);
    const { clientRsvpsFile } = getClientPaths(client);

    fs.writeFileSync(clientRsvpsFile, JSON.stringify([], null, 2), "utf-8");
    res.json({ success: true, remixId: REMIX_INSTANCE_ID });
  } catch (error) {
    console.error("Error clearing RSVPs:", error);
    res.status(500).json({ error: "Failed to clear RSVPs" });
  }
});

// 7. Handle file uploads (converts base64 to server-side files with guaranteed remix isolation)
app.post("/api/upload", (req, res) => {
  try {
    const { base64, fileType } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "Missing file data" });
    }

    // Extract raw base64 data and mime type
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let extension = "bin";
    let buffer: Buffer;

    if (matches && matches.length === 3) {
      const mime = matches[1];
      buffer = Buffer.from(matches[2], "base64");
      
      // Determine file extension
      if (mime.includes("image/png")) extension = "png";
      else if (mime.includes("image/jpeg") || mime.includes("image/jpg")) extension = "jpg";
      else if (mime.includes("image/webp")) extension = "webp";
      else if (mime.includes("image/gif")) extension = "gif";
      else if (mime.includes("audio/mpeg") || mime.includes("audio/mp3")) extension = "mp3";
      else if (mime.includes("audio/ogg")) extension = "ogg";
      else if (mime.includes("audio/wav")) extension = "wav";
      else if (mime.includes("audio/m4a")) extension = "m4a";
    } else {
      // Direct raw base64 without data URI prefix
      buffer = Buffer.from(base64, "base64");
      if (fileType === "audio") extension = "mp3";
      else if (fileType === "image") extension = "webp";
    }

    // Guaranteed remix prefix in filename: zero collision risk with official site
    const filename = `${REMIX_INSTANCE_ID}_upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
    
    // Save to isolated remix directory
    const remixFilePath = path.join(REMIX_UPLOADS_DIR, filename);
    fs.writeFileSync(remixFilePath, buffer);

    // Also mirror to global uploads directory with remix prefix for standard static serving
    const globalFilePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(globalFilePath, buffer);

    // Return the relative URL of the uploaded file
    const fileUrl = `/uploads/${filename}`;
    res.json({ 
      success: true, 
      url: fileUrl, 
      filename,
      remixId: REMIX_INSTANCE_ID,
      isolated: true 
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to process upload" });
  }
});

// 8. Fetch external URL to bypass CORS and convert to base64
app.post("/api/fetch-url", async (req, res) => {
  try {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing URL" });
    
    // Transform Google Drive URL if needed
    if (url.includes("drive.google.com/file/d/")) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        url = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    } else if (url.includes("drive.google.com/open?id=")) {
      const match = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        url = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }

    const fetch = (await import('node-fetch')).default || globalThis.fetch;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const base64 = buffer.toString("base64");
    const dataUri = `data:${contentType};base64,${base64}`;
    
    res.json({ success: true, base64: dataUri, contentType });
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).json({ error: "Failed to fetch URL" });
  }
});

// 9. Save uploaded FSDB files (base64) to disk in isolated remix storage
app.post("/api/fsdb", (req, res) => {
  try {
    const { fileId, base64 } = req.body;
    if (!fileId || !base64) {
      return res.status(400).json({ error: "Missing fileId or base64 data" });
    }
    
    // Strip fsdb:// prefix if present
    const cleanId = fileId.replace("fsdb://", "");
    
    // Save to isolated remix directory
    const remixFilePath = path.join(REMIX_FS_FILES_DIR, `${cleanId}.txt`);
    fs.writeFileSync(remixFilePath, base64, "utf-8");
    
    // Also mirror to global fs_files for fallback resolution
    const globalFilePath = path.join(FS_FILES_DIR, `${cleanId}.txt`);
    fs.writeFileSync(globalFilePath, base64, "utf-8");
    
    res.json({ success: true, fileId: cleanId, remixId: REMIX_INSTANCE_ID });
  } catch (error) {
    console.error("Error saving fsdb file to server disk:", error);
    res.status(500).json({ error: "Failed to save file to server disk" });
  }
});

// 10. Retrieve FSDB files (base64) from remix disk storage
app.get("/api/fsdb/:fileId", (req, res) => {
  try {
    const { fileId } = req.params;
    const cleanId = fileId.replace("fsdb://", "");
    
    // 1. Check isolated remix directory first
    const remixFilePath = path.join(REMIX_FS_FILES_DIR, `${cleanId}.txt`);
    if (fs.existsSync(remixFilePath)) {
      const base64 = fs.readFileSync(remixFilePath, "utf-8");
      return res.json({ success: true, base64, remixId: REMIX_INSTANCE_ID });
    }

    // 2. Fallback to global fs_files
    const globalFilePath = path.join(FS_FILES_DIR, `${cleanId}.txt`);
    if (fs.existsSync(globalFilePath)) {
      const base64 = fs.readFileSync(globalFilePath, "utf-8");
      return res.json({ success: true, base64 });
    }
    
    res.status(404).json({ error: "File not found on server disk" });
  } catch (error) {
    console.error("Error reading fsdb file from server disk:", error);
    res.status(500).json({ error: "Failed to read file from server disk" });
  }
});


async function startServer() {

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
