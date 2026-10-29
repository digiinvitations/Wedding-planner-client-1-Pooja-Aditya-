import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Trash2, Image as ImageIcon, Calendar, Settings, Database, Map, CheckCircle2,
  Download, Upload, ShieldCheck, Heart, Sparkles, Shirt, Building2, MessageSquare,
  Users, Phone, User, Plus, Crown, Send, RefreshCw, FileText, Type, EyeOff
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { WeddingConfig } from "../weddingConfig";
import { AssetManager } from "./AssetManager";
import { TypographyManager } from "./TypographyManager";
import {
  getActiveWorkspace,
  setActiveWorkspace,
  sanitizeWorkspaceId,
  WORKSPACE_PRESETS,
  getKnownWorkspaces,
  REMIX_APPLET_ID,
  REMIX_INSTANCE_ID
} from "../lib/clientWorkspace";
import { fetchRsvpsFromDb, deleteLocalRsvp, clearAllLocalRsvps, RSVPRecord } from "../lib/db";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: WeddingConfig;
  onConfigChange: (newConfig: WeddingConfig) => Promise<void>;
  mode?: "edit" | "admin" | "rsvp";
  initialTab?: "workspace" | "couple" | "story" | "dress_code" | "hotel_stay" | "rsvp" | "events" | "cover" | "assets" | "typography";
  title?: string;
  onToggleFloatingEditButton?: (visible: boolean) => void;
  isFloatingEditButtonVisible?: boolean;
  onHideAdminEditButtons?: () => void;
  hideAdminEditButtons?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, 
  onClose, 
  config, 
  onConfigChange,
  mode = "edit",
  initialTab,
  title,
  onToggleFloatingEditButton,
  isFloatingEditButtonVisible = false,
  onHideAdminEditButtons,
  hideAdminEditButtons = false
}) => {
  const getDefaultTab = () => {
    if (mode === "admin") return initialTab || "workspace";
    if (mode === "rsvp") return "rsvp";
    return initialTab || "typography";
  };

  const [activeTab, setActiveTab] = useState<
    "workspace" | "couple" | "story" | "dress_code" | "hotel_stay" | "rsvp" | "events" | "cover" | "assets" | "typography"
  >(getDefaultTab());
  const [editConfig, setEditConfig] = useState<WeddingConfig>(config);
  const [currentWorkspace, setCurrentWorkspace] = useState(getActiveWorkspace());
  const [customWorkspaceInput, setCustomWorkspaceInput] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [rsvpsList, setRsvpsList] = useState<RSVPRecord[]>([]);
  const [isLoadingRsvps, setIsLoadingRsvps] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#D4AF37");
  const [newAmenity, setNewAmenity] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit") {
        const allowed = ["typography", "couple", "events", "story", "dress_code", "hotel_stay", "rsvp"];
        if (initialTab && allowed.includes(initialTab)) {
          setActiveTab(initialTab);
        } else if (!allowed.includes(activeTab)) {
          setActiveTab("typography");
        }
      } else if (mode === "admin") {
        const allowed = ["workspace", "events", "cover", "assets", "typography"];
        if (initialTab && allowed.includes(initialTab)) {
          setActiveTab(initialTab);
        } else if (!allowed.includes(activeTab)) {
          setActiveTab("workspace");
        }
      } else if (mode === "rsvp") {
        setActiveTab("rsvp");
      } else if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, mode, initialTab]);

  const loadRsvps = async () => {
    setIsLoadingRsvps(true);
    try {
      const list = await fetchRsvpsFromDb(currentWorkspace);
      setRsvpsList(list || []);
    } catch (err) {
      console.warn("Failed to load RSVPs for admin", err);
    } finally {
      setIsLoadingRsvps(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "rsvp") {
      loadRsvps();
    }
  }, [isOpen, activeTab, currentWorkspace]);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditConfig(config);
    }
  }, [isOpen, config]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(editConfig, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wedding_config_backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processImportFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        setEditConfig(importedData);
        alert("Data imported successfully! Please click 'Save Changes' to apply permanently.");
      } catch (err) {
        alert("Invalid file format. Please upload a valid JSON config file.");
      }
    };
    reader.readAsText(file);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImportFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImportFile(e.dataTransfer.files[0]);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onConfigChange(editConfig);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      // Error is alerted by parent
    } finally {
      setIsSaving(false);
    }
  };


  

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="admin-panel-root"
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-[110] bg-[#C9A45C]/90 backdrop-blur-sm flex flex-col items-center justify-center text-white border-4 border-dashed border-white m-4 rounded-[2rem]">
              <Upload size={64} className="mb-4" />
              <h2 className="text-3xl font-display font-bold">Drop JSON config file here</h2>
              <p className="mt-2 text-white/80">The data will be imported immediately</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-4xl bg-white border border-[#C9A45C]/30 rounded-[2rem] shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#C9A45C]/20 bg-[#FFF9F3] shrink-0">
              <div>
                <h3 className="font-display text-xl text-[#B94E2F] flex items-center gap-2 font-bold">
                  <Settings size={22} className="text-[#C9A45C]" />
                  {title || (mode === "admin" ? "Admin Panel" : mode === "rsvp" ? "RSVP Submissions" : "Edit Panel")}
                </h3>
                <p className="text-[10px] text-[#765E52] uppercase tracking-widest mt-1">
                  {mode === "admin" 
                    ? "System Workspace, Ceremonies & Assets" 
                    : mode === "rsvp"
                    ? "Guest RSVP Responses & Attendance"
                    : "Couple & Lineage, Story, Dress Code, Stay & RSVPs"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleImportFile} 
                  className="hidden" 
                />
                {onHideAdminEditButtons && (
                  <button
                    type="button"
                    onClick={() => {
                      onHideAdminEditButtons();
                      onClose();
                    }}
                    title="Completely hide Edit panel & Admin panel buttons from website (unlock by clicking family photo 5 times)"
                    className="bg-[#641D2E] hover:bg-[#85253C] text-[#dec47f] border border-[#dec47f]/40 px-3 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <EyeOff size={16} /> <span className="hidden sm:inline">Hide Panels</span>
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Import Data"
                  className="bg-[#FFF9F3] border border-[#C9A45C]/50 hover:bg-[#F5EDD6] text-[#B94E2F] px-3 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                >
                  <Upload size={16} /> <span className="hidden md:inline">Import</span>
                </button>
                <button
                  onClick={handleExport}
                  title="Export Data"
                  className="bg-[#FFF9F3] border border-[#C9A45C]/50 hover:bg-[#F5EDD6] text-[#B94E2F] px-3 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                >
                  <Download size={16} /> <span className="hidden md:inline">Export</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#B94E2F] hover:bg-[#8F3B22] text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Changes"}
                </button>
                <button
                  onClick={onClose}
                  className="text-[#765E52] hover:text-[#B94E2F] hover:bg-[#B94E2F]/10 p-2 rounded-full cursor-pointer transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden bg-white">
              {/* Sidebar Tabs */}
              <div className="flex md:flex-col gap-2 p-4 border-b md:border-b-0 md:border-r border-[#C9A45C]/20 bg-[#FFF9F3]/30 overflow-x-auto md:overflow-y-auto md:w-56 shrink-0 no-scrollbar">
                {/* ADMIN MODE TABS: Workspace, Events, Cover & Music, Assets */}
                {/* ADMIN MODE TABS: Workspace, Events, Cover & Music, Assets, Typography */}
                {mode === "admin" && (
                  <>
                    <button onClick={() => setActiveTab("workspace")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "workspace" ? "bg-[#641D2E] text-[#dec47f] shadow-md border border-[#dec47f]/40 font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <ShieldCheck size={18} className="text-[#C9A45C]" /> Client Workspace
                    </button>
                    <button onClick={() => setActiveTab("couple")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "couple" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <Crown size={18} /> Couple &amp; Hero Family
                    </button>
                    <button onClick={() => setActiveTab("typography")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "typography" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <Type size={18} /> Font Sizes &amp; Typography
                    </button>
                    <button onClick={() => setActiveTab("events")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "events" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <Map size={18} /> Sacred Ceremonies 
                    </button>
                    <button onClick={() => setActiveTab("cover")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "cover" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <ImageIcon size={18} /> Cover & Music
                    </button>
                    <button onClick={() => setActiveTab("assets")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "assets" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <Database size={18} /> Asset Manager 
                    </button>
                  </>
                )}

                {/* EDIT MODE TABS: TYPOGRAPHY, DRESS CODE & THEME, COUPLE & LINEAGE, CEREMONIES & MAP, INVITATION STORY, HOTEL & STAY INFO, RSVP SUBMISSION */}
                {mode === "edit" && (
                  <>
                    <button onClick={() => setActiveTab("typography")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "typography" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <Type size={18} /> Font Sizes &amp; Typography
                    </button>
                    <button onClick={() => setActiveTab("dress_code")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "dress_code" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <Shirt size={18} /> Dress Code &amp; Theme
                    </button>
                    <button onClick={() => setActiveTab("couple")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "couple" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <Crown size={18} /> Couple & Lineage
                    </button>
                    <button onClick={() => setActiveTab("events")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "events" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <Calendar size={18} /> Ceremonies & Maps
                    </button>
                    <button onClick={() => setActiveTab("story")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "story" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <FileText size={18} /> Invitation Story
                    </button>
                    <button onClick={() => setActiveTab("hotel_stay")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "hotel_stay" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <Building2 size={18} /> Hotel & Stay Info
                    </button>
                    <button onClick={() => setActiveTab("rsvp")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeTab === "rsvp" ? "bg-[#B94E2F] text-white shadow-md font-bold" : "text-[#765E52] hover:bg-[#B94E2F]/10"}`}> 
                      <MessageSquare size={18} /> RSVP Submissions
                    </button>
                  </>
                )}

                {/* RSVP MODE TAB */}
                {mode === "rsvp" && (
                  <button onClick={() => setActiveTab("rsvp")} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 bg-[#B94E2F] text-white shadow-md font-bold"> 
                    <MessageSquare size={18} /> RSVP Submissions
                  </button>
                )}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-white">
                {/* TYPOGRAPHY TAB */}
                {activeTab === "typography" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-6">
                    <TypographyManager
                      typography={editConfig.typography}
                      onChange={(newTypo) => setEditConfig((c) => ({ ...c, typography: newTypo }))}
                    />
                  </motion.div>
                )}

                {/* WORKSPACE TAB */}
                {activeTab === "workspace" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-6">
                    <div className="bg-[#FFF9F3] p-6 rounded-2xl border-2 border-[#C9A45C]/40 space-y-5">
                      <div className="flex items-center justify-between border-b border-[#C9A45C]/30 pb-3">
                        <h4 className="text-sm font-bold text-[#641D2E] flex items-center gap-2 uppercase tracking-widest">
                          <ShieldCheck size={18} className="text-emerald-600" />
                          Multi-Tenant Remix Isolation
                        </h4>
                        <span className="text-xs bg-[#dec47f]/30 border border-[#dec47f] text-[#641D2E] px-2.5 py-1 rounded-full font-bold">
                          Active: {currentWorkspace}
                        </span>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 leading-relaxed space-y-2">
                        <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          Remix Isolation Active (Zero Overlap with Official Site)
                        </div>
                        <p>
                          Every file and data item added to this website is completely segregated into dedicated remix storage and separate database fields:
                        </p>
                        <div className="font-mono text-[10px] bg-white/90 p-2.5 rounded-lg border border-emerald-300 space-y-1">
                          <div>• <span className="font-bold text-emerald-950">Remix Identifier:</span> {REMIX_INSTANCE_ID} ({REMIX_APPLET_ID})</div>
                          <div>• <span className="font-bold text-emerald-950">Firestore Config:</span> remix_websites/{REMIX_INSTANCE_ID}/workspaces/{sanitizeWorkspaceId(currentWorkspace)}</div>
                          <div>• <span className="font-bold text-emerald-950">Separate Fields:</span> remix_wedding_config, remix_applet_id, remix_instance_id, is_remix</div>
                          <div>• <span className="font-bold text-emerald-950">Firestore RSVPs:</span> remix_websites/{REMIX_INSTANCE_ID}/workspaces/{sanitizeWorkspaceId(currentWorkspace)}/rsvps</div>
                          <div>• <span className="font-bold text-emerald-950">Uploaded Files & Media:</span> remix_fs_files & uploads/{REMIX_INSTANCE_ID}_*</div>
                          <div>• <span className="font-bold text-emerald-950">Server Disk:</span> src/data/{REMIX_INSTANCE_ID}/</div>
                        </div>
                        <p className="text-[10px] text-emerald-700 italic">
                          Official website data (website/permanent_data, settings/config, and root files) will never be overwritten or touched.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#641D2E] uppercase tracking-wide mb-2">
                          Switch Active Client Profile:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {WORKSPACE_PRESETS.map((preset) => {
                            const isSelected = currentWorkspace === preset;
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setCurrentWorkspace(preset);
                                  setActiveWorkspace(preset);
                                  setEditConfig(c => ({ ...c, clientWorkspace: preset }));
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#641D2E] text-[#dec47f] font-bold shadow-md ring-2 ring-[#C9A45C]"
                                    : "bg-white text-[#765E52] hover:bg-[#FFF3E0] border border-[#C9A45C]/40"
                                }`}
                              >
                                {isSelected ? `✓ ${preset}` : preset}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#C9A45C]/20">
                        <label className="block text-xs font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">
                          Or Name a Custom Client:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customWorkspaceInput}
                            onChange={(e) => setCustomWorkspaceInput(e.target.value)}
                            placeholder="e.g. October Clients - 1"
                            className="flex-1 bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#B94E2F]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customWorkspaceInput.trim()) {
                                const clean = customWorkspaceInput.trim();
                                setCurrentWorkspace(clean);
                                setActiveWorkspace(clean);
                                setEditConfig(c => ({ ...c, clientWorkspace: clean }));
                                setCustomWorkspaceInput("");
                              }
                            }}
                            className="bg-[#C9A45C] hover:bg-[#B94E2F] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Set Client
                          </button>
                        </div>
                      </div>

                      {/* Floating Edit Invitation Button Control */}
                      <div className="pt-4 border-t border-[#C9A45C]/20 bg-white p-4 rounded-xl border border-[#C9A45C]/30 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-[#641D2E] uppercase tracking-wider block">
                              Floating &quot;Edit Your Invitation&quot; Button
                            </span>
                            <span className="text-[11px] text-[#765E52]">
                              Controls whether the floating edit pill appears on the website. Only Admin can unhide it.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !(editConfig.showFloatingEditButton ?? isFloatingEditButtonVisible);
                              setEditConfig(c => ({ ...c, showFloatingEditButton: nextVal }));
                              if (onToggleFloatingEditButton) {
                                onToggleFloatingEditButton(nextVal);
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 ${
                              (editConfig.showFloatingEditButton ?? isFloatingEditButtonVisible)
                                ? "bg-emerald-600 text-white"
                                : "bg-[#FFF9F3] text-[#765E52] border border-[#C9A45C]/40 hover:bg-[#F5EDD6]"
                            }`}
                          >
                            {(editConfig.showFloatingEditButton ?? isFloatingEditButtonVisible) ? "✓ Visible / Unhidden" : "Hidden (Click to Unhide)"}
                          </button>
                        </div>
                      </div>

                      {/* Hide Edit Panel & Admin Panel Buttons Control */}
                      <div className="pt-4 border-t border-[#C9A45C]/20 bg-[#FFF9F3]/60 p-4 rounded-xl border border-[#C9A45C]/30 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-[#641D2E] uppercase tracking-wider block flex items-center gap-1.5">
                              <EyeOff size={14} className="text-[#B94E2F]" />
                              Hide Edit Panel &amp; Admin Panel Buttons
                            </span>
                            <span className="text-[11px] text-[#765E52] block mt-0.5">
                              Completely hide both Edit and Admin buttons from the website. Only unlock by clicking the family photo 5 times.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (onHideAdminEditButtons) {
                                onHideAdminEditButtons();
                              }
                              onClose();
                            }}
                            className="bg-[#641D2E] hover:bg-[#B94E2F] text-[#dec47f] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0 border border-[#dec47f]/40 cursor-pointer"
                          >
                            <EyeOff size={14} />
                            Hide Buttons
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* COVER TAB */}
                {activeTab === "cover" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-6">
                    <div className="bg-[#FFF9F3]/50 p-5 rounded-2xl border border-[#C9A45C]/20 space-y-5">
                      <h4 className="text-sm font-bold text-[#4B3A35] flex items-center gap-2 uppercase tracking-widest border-b border-[#C9A45C]/20 pb-3">
                        Opening Page & Music
                      </h4>
                      
                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Opening Page Thumbnail (Image)</label>
                        <input 
                          type="text" 
                          value={editConfig.openingBackgroundImageUrl || ''}
                          onChange={e => setEditConfig(c => ({...c, openingBackgroundImageUrl: e.target.value}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B94E2F]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Opening Page Video URL</label>
                        <input 
                          type="text" 
                          value={editConfig.openingVideoUrl || ''}
                          onChange={e => setEditConfig(c => ({...c, openingVideoUrl: e.target.value}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B94E2F]"
                          placeholder="Video will play behind the envelope"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Background Music URL (Auto-plays after opening)</label>
                        <input 
                          type="text" 
                          value={editConfig.musicUrl || ''}
                          onChange={e => setEditConfig(c => ({...c, musicUrl: e.target.value}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B94E2F]"
                        />
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* COUPLE & LINEAGE TAB */}
                {activeTab === "couple" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-6">
                    {/* Priority Order Banner */}
                    <div className="bg-[#FFF9F3] p-5 rounded-2xl border-2 border-[#C9A45C]/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#641D2E] flex items-center gap-2 uppercase tracking-widest">
                          <Crown size={18} className="text-[#dec47f]" /> Display Priority
                        </h4>
                        <span className="text-xs font-bold px-3 py-1 bg-[#641D2E] text-[#dec47f] rounded-full">
                          Current Priority: {editConfig.priorityOrder === "bride" ? "Bride First" : "Groom First (Active)"}
                        </span>
                      </div>
                      <p className="text-xs text-[#765E52]">
                        Determine whether the Groom or Bride appears first in the top header, hero section, story headings, and invitations.
                      </p>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditConfig(c => ({ ...c, priorityOrder: "groom" }))}
                          className={`p-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            (editConfig.priorityOrder ?? "groom") === "groom"
                              ? "border-[#B94E2F] bg-[#B94E2F] text-white shadow-md ring-2 ring-[#dec47f]"
                              : "border-[#C9A45C]/30 bg-white text-[#765E52] hover:bg-[#FFF9F3]"
                          }`}
                        >
                          👑 Groom Priority (Aditya First)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditConfig(c => ({ ...c, priorityOrder: "bride" }))}
                          className={`p-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            editConfig.priorityOrder === "bride"
                              ? "border-[#B94E2F] bg-[#B94E2F] text-white shadow-md ring-2 ring-[#dec47f]"
                              : "border-[#C9A45C]/30 bg-white text-[#765E52] hover:bg-[#FFF9F3]"
                          }`}
                        >
                          👰 Bride Priority (Pooja First)
                        </button>
                      </div>
                    </div>

                    {/* Family Section Visibility Toggle */}
                    <div className="bg-[#FFF9F3] p-5 rounded-2xl border-2 border-[#C9A45C]/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#641D2E] flex items-center gap-2 uppercase tracking-widest">
                            <Users size={18} className="text-[#C9A45C]" /> Family Details Section
                          </h4>
                          <p className="text-xs text-[#765E52] mt-1">
                            Show or hide the entire Family Details section (Aditya Ramesh &amp; Pooja Devi family details) on the website.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditConfig(c => ({ ...c, showFamilyDetails: !(c.showFamilyDetails ?? true) }))}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                            (editConfig.showFamilyDetails ?? true)
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-[#641D2E] text-white hover:bg-[#85253C]"
                          }`}
                        >
                          {(editConfig.showFamilyDetails ?? true) ? "✓ Visible / Unhidden" : "Hidden (Click to Unhide)"}
                        </button>
                      </div>
                    </div>

                    {/* Groom Card */}
                    <div className="bg-[#FFF9F3]/70 p-5 rounded-2xl border border-[#C9A45C]/30 space-y-4">
                      <h4 className="text-sm font-bold text-[#641D2E] flex items-center gap-2 uppercase tracking-widest border-b border-[#C9A45C]/20 pb-2">
                        👑 Groom Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Groom Full Name</label>
                          <input 
                            type="text" 
                            value={editConfig.groom?.name || ''}
                            onChange={e => setEditConfig(c => ({...c, groom: {...c.groom, name: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Aditya Ramesh"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Father's Name</label>
                          <input 
                            type="text" 
                            value={editConfig.groom?.fatherName || ''}
                            onChange={e => {
                              const f = e.target.value;
                              setEditConfig(c => {
                                const m = c.groom?.motherName || "Usha Ramesh";
                                const fClean = `Mr. ${(f || "T.V. Ramesh").replace(/^(Mr\.?|Shri\.?)\s*/i, "").trim()}`;
                                const mClean = `Mrs. ${(m || "Usha Ramesh").replace(/^(Mrs\.?|Smt\.?)\s*/i, "").trim()}`;
                                const lineageStr = `Son of ${fClean} & ${mClean}`;
                                return {
                                  ...c,
                                  groom: { ...c.groom, fatherName: f, introLineage: lineageStr },
                                  heroSettings: { ...c.heroSettings, groomParents: lineageStr }
                                };
                              });
                            }}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Mr. T.V. Ramesh"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Mother's Name</label>
                          <input 
                            type="text" 
                            value={editConfig.groom?.motherName || ''}
                            onChange={e => {
                              const m = e.target.value;
                              setEditConfig(c => {
                                const f = c.groom?.fatherName || "T.V. Ramesh";
                                const fClean = `Mr. ${(f || "T.V. Ramesh").replace(/^(Mr\.?|Shri\.?)\s*/i, "").trim()}`;
                                const mClean = `Mrs. ${(m || "Usha Ramesh").replace(/^(Mrs\.?|Smt\.?)\s*/i, "").trim()}`;
                                const lineageStr = `Son of ${fClean} & ${mClean}`;
                                return {
                                  ...c,
                                  groom: { ...c.groom, motherName: m, introLineage: lineageStr },
                                  heroSettings: { ...c.heroSettings, groomParents: lineageStr }
                                };
                              });
                            }}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Mrs. Usha Ramesh"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Intro / Lineage</label>
                          <input 
                            type="text" 
                            value={editConfig.groom?.lineage || editConfig.heroSettings?.groomParents || ''}
                            onChange={e => setEditConfig(c => ({
                              ...c, 
                              groom: {...c.groom, lineage: e.target.value},
                              heroSettings: {...c.heroSettings, groomParents: e.target.value}
                            }))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Son of Mr. T.V. Ramesh & Mrs. Usha Ramesh"
                          />
                        </div>
                        <div className="md:col-span-2 pt-2 border-t border-[#C9A45C]/20">
                          <label className="block text-[11px] font-semibold text-[#641D2E] mb-1.5 uppercase tracking-wide flex items-center justify-between">
                            <span>Hero Section Family Members (Brother / Sister / In-laws)</span>
                            <span className="text-[10px] text-[#B94E2F] font-normal lowercase italic">one per line</span>
                          </label>
                          <textarea 
                            rows={3}
                            value={(editConfig.heroSettings?.groomFamilyMembers !== undefined
                              ? editConfig.heroSettings.groomFamilyMembers
                              : [
                                  "Megha Ramesh (Sister) & Sekhar Kothanath (Brother in law)",
                                  "Xerxes Randeria (Brother) & Ayesha Nicole Ali (Sister)"
                                ]
                            ).join("\n")}
                            onChange={e => {
                              const lines = e.target.value.split("\n");
                              setEditConfig(c => ({
                                ...c,
                                heroSettings: {
                                  ...c.heroSettings,
                                  groomFamilyMembers: lines
                                }
                              }));
                            }}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#B94E2F] font-sans leading-relaxed"
                            placeholder={"Megha Ramesh (Sister) & Sekhar Kothanath (Brother in law)\nXerxes Randeria (Brother) & Ayesha Nicole Ali (Sister)"}
                          />
                          <p className="text-[10px] text-[#765E52] mt-1">
                            These names appear under the Groom's parents in the Hero section. You can edit, replace, add, or delete any names.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bride Card */}
                    <div className="bg-[#FFF9F3]/70 p-5 rounded-2xl border border-[#C9A45C]/30 space-y-4">
                      <h4 className="text-sm font-bold text-[#641D2E] flex items-center gap-2 uppercase tracking-widest border-b border-[#C9A45C]/20 pb-2">
                        👰 Bride Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Bride Full Name</label>
                          <input 
                            type="text" 
                            value={editConfig.bride?.name || ''}
                            onChange={e => setEditConfig(c => ({...c, bride: {...c.bride, name: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Pooja Devi"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Father's Name</label>
                          <input 
                            type="text" 
                            value={editConfig.bride?.fatherName || ''}
                            onChange={e => {
                              const f = e.target.value;
                              setEditConfig(c => {
                                const m = c.bride?.motherName || "Momi Devi";
                                const fClean = `Mr. ${(f || "Babul Nath").replace(/^(Mr\.?|Shri\.?)\s*/i, "").trim()}`;
                                const mClean = `Mrs. ${(m || "Momi Devi").replace(/^(Mrs\.?|Smt\.?)\s*/i, "").trim()}`;
                                const lineageStr = `Daughter of ${fClean} & ${mClean}`;
                                return {
                                  ...c,
                                  bride: { ...c.bride, fatherName: f, introLineage: lineageStr },
                                  heroSettings: { ...c.heroSettings, brideParents: lineageStr }
                                };
                              });
                            }}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Mr. Babul Nath"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Mother's Name</label>
                          <input 
                            type="text" 
                            value={editConfig.bride?.motherName || ''}
                            onChange={e => {
                              const m = e.target.value;
                              setEditConfig(c => {
                                const f = c.bride?.fatherName || "Babul Nath";
                                const fClean = `Mr. ${(f || "Babul Nath").replace(/^(Mr\.?|Shri\.?)\s*/i, "").trim()}`;
                                const mClean = `Mrs. ${(m || "Momi Devi").replace(/^(Mrs\.?|Smt\.?)\s*/i, "").trim()}`;
                                const lineageStr = `Daughter of ${fClean} & ${mClean}`;
                                return {
                                  ...c,
                                  bride: { ...c.bride, motherName: m, introLineage: lineageStr },
                                  heroSettings: { ...c.heroSettings, brideParents: lineageStr }
                                };
                              });
                            }}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Mrs. Momi Devi"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Intro / Lineage</label>
                          <input 
                            type="text" 
                            value={editConfig.bride?.lineage || editConfig.heroSettings?.brideParents || ''}
                            onChange={e => setEditConfig(c => ({
                              ...c, 
                              bride: {...c.bride, lineage: e.target.value},
                              heroSettings: {...c.heroSettings, brideParents: e.target.value}
                            }))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Daughter of Mr. Babul Nath & Mrs. Momi Devi"
                          />
                        </div>
                        <div className="md:col-span-2 pt-2 border-t border-[#C9A45C]/20">
                          <label className="block text-[11px] font-semibold text-[#641D2E] mb-1.5 uppercase tracking-wide flex items-center justify-between">
                            <span>Hero Section Family Members (Brother / Sister / In-laws)</span>
                            <span className="text-[10px] text-[#B94E2F] font-normal lowercase italic">one per line</span>
                          </label>
                          <textarea 
                            rows={3}
                            value={(editConfig.heroSettings?.brideFamilyMembers !== undefined
                              ? editConfig.heroSettings.brideFamilyMembers
                              : [
                                  "Akash Jyoti Nath (Brother)",
                                  "Upasana Devi (Sister in law)"
                                ]
                            ).join("\n")}
                            onChange={e => {
                              const lines = e.target.value.split("\n");
                              setEditConfig(c => ({
                                ...c,
                                heroSettings: {
                                  ...c.heroSettings,
                                  brideFamilyMembers: lines
                                }
                              }));
                            }}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#B94E2F] font-sans leading-relaxed"
                            placeholder={"Akash Jyoti Nath (Brother)\nUpasana Devi (Sister in law)"}
                          />
                          <p className="text-[10px] text-[#765E52] mt-1">
                            These names appear under the Bride's parents in the Hero section. You can edit, replace, add, or delete any names.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Wedding Date & Countdown Settings */}
                    <div className="bg-[#FFF9F3]/70 p-5 rounded-2xl border border-[#C9A45C]/30 space-y-4">
                      <h4 className="text-sm font-bold text-[#4B3A35] flex items-center gap-2 uppercase tracking-widest border-b border-[#C9A45C]/20 pb-2">
                        <Calendar size={18} /> Wedding Target Date & Countdown
                      </h4>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Wedding Date & Time</label>
                        <input 
                          type="datetime-local" 
                          value={editConfig.weddingDate.substring(0, 16)}
                          onChange={e => setEditConfig(c => ({...c, weddingDate: e.target.value}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                        />
                        <p className="text-[10px] text-[#765E52] mt-1">Controls the live countdown timer on the invitation.</p>
                      </div>
                    </div>

                    {/* Hero Presentation Settings */}
                    <div className="bg-[#FFF9F3]/50 p-5 rounded-2xl border border-[#C9A45C]/20 space-y-4">
                      <h4 className="text-sm font-bold text-[#4B3A35] flex items-center gap-2 uppercase tracking-widest border-b border-[#C9A45C]/20 pb-2">
                        Hero Atmosphere & Blessings
                      </h4>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Introductory Blessing Text</label>
                        <textarea 
                          value={editConfig.heroSettings?.introText || ''}
                          onChange={e => setEditConfig(c => ({...c, heroSettings: {...c.heroSettings, introText: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F] h-20"
                          placeholder="With the celestial blessings of our ancestors and family..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Background Video URL (Looping)</label>
                        <input 
                          type="text" 
                          value={editConfig.heroSettings?.bgVideoUrl || ''}
                          onChange={e => setEditConfig(c => ({...c, heroSettings: {...c.heroSettings, bgVideoUrl: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                          placeholder="https://example.com/video.mp4"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Custom Top Icon URL</label>
                        <input 
                          type="text" 
                          value={editConfig.heroSettings?.ganeshaIconUrl || ''}
                          onChange={e => setEditConfig(c => ({...c, heroSettings: {...c.heroSettings, ganeshaIconUrl: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                          placeholder="https://example.com/icon.png"
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <input
                          type="checkbox"
                          checked={editConfig.heroSettings?.showPetals ?? true}
                          onChange={(e) => setEditConfig(c => ({...c, heroSettings: {...c.heroSettings, showPetals: e.target.checked}}))}
                          className="w-4 h-4 rounded text-[#B94E2F] focus:ring-[#B94E2F]"
                          id="showPetals"
                        />
                        <label htmlFor="showPetals" className="text-sm font-semibold text-[#765E52]">Show Falling Petals Animation</label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* INVITATION STORY TAB */}
                {activeTab === "story" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-6">
                    <div className="bg-[#FFF9F3]/70 p-5 rounded-2xl border border-[#C9A45C]/30 space-y-4">
                      <h4 className="text-sm font-bold text-[#641D2E] flex items-center gap-2 uppercase tracking-widest border-b border-[#C9A45C]/20 pb-2">
                        <FileText size={18} /> Invitation Message Chapters
                      </h4>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Story Title / Theme Banner</label>
                        <input 
                          type="text" 
                          value={editConfig.invitationStory?.title || ''}
                          onChange={e => setEditConfig(c => ({...c, invitationStory: {...c.invitationStory, title: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F] font-bold text-[#641D2E]"
                          placeholder="DIFFERENT ROOTS • SAME DREAMS"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Chapter 1: The Meeting</label>
                        <textarea 
                          value={editConfig.invitationStory?.meeting || ''}
                          onChange={e => setEditConfig(c => ({...c, invitationStory: {...c.invitationStory, meeting: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F] h-24"
                          placeholder="Like a warm Kerala sunset and Assamese breeze our paths crossed..."
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Chapter 2: The Journey</label>
                        <textarea 
                          value={editConfig.invitationStory?.journey || ''}
                          onChange={e => setEditConfig(c => ({...c, invitationStory: {...c.invitationStory, journey: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F] h-24"
                          placeholder="What started as friendship grew into love filled with laughter..."
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Chapter 3: The Forever</label>
                        <textarea 
                          value={editConfig.invitationStory?.forever || ''}
                          onChange={e => setEditConfig(c => ({...c, invitationStory: {...c.invitationStory, forever: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F] h-24"
                          placeholder="Today, as WE begin our next chapter, We invite you to be part of love..."
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* DRESS CODE & THEME TAB */}
                {activeTab === "dress_code" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-6">
                    <div className="bg-[#FFF9F3]/70 p-5 rounded-2xl border border-[#C9A45C]/30 space-y-5">
                      <div className="flex items-center justify-between border-b border-[#C9A45C]/20 pb-3">
                        <h4 className="text-sm font-bold text-[#641D2E] flex items-center gap-2 uppercase tracking-widest">
                          <Shirt size={18} className="text-[#dec47f]" /> Dress Code / Theme Configuration
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#641D2E]">
                          <input 
                            type="checkbox"
                            checked={editConfig.dressCode?.enabled ?? true}
                            onChange={e => setEditConfig(c => ({...c, dressCode: {...c.dressCode, enabled: e.target.checked}}))}
                            className="w-4 h-4 rounded text-[#B94E2F]"
                          />
                          Enable Section
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Section Title</label>
                        <input 
                          type="text" 
                          value={editConfig.dressCode?.themeTitle || 'Dress Code'}
                          onChange={e => setEditConfig(c => ({...c, dressCode: {...c.dressCode, themeTitle: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                          placeholder="Dress Code"
                        />
                      </div>

                      {/* Quick Font Size Adjustment Shortcut */}
                      <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-[#C9A45C]/30 shadow-xs">
                        <div>
                          <span className="text-xs font-bold text-[#641D2E] block">Dress Code Font Sizing</span>
                          <span className="text-[11px] text-[#765E52]">Adjust heading, category badge, ceremony titles &amp; instructions size</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("typography")}
                          className="inline-flex items-center gap-1.5 bg-[#FFF9F3] hover:bg-[#F5EDD6] text-[#B94E2F] border border-[#C9A45C]/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                        >
                          <Type size={13} />
                          <span>Adjust Font Sizes</span>
                        </button>
                      </div>

                      {/* Dress Code Events Management */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#641D2E] uppercase tracking-wider">Ceremony Dress Code Items</span>
                          <button
                            type="button"
                            onClick={() => {
                              const curEvents = editConfig.dressCode?.events || [];
                              setEditConfig(c => ({
                                ...c,
                                dressCode: {
                                  ...c.dressCode,
                                  enabled: c.dressCode?.enabled ?? true,
                                  events: [...curEvents, { event: "New Ceremony", instructions: ["Guideline 1"] }]
                                }
                              }));
                            }}
                            className="inline-flex items-center gap-1.5 bg-[#B94E2F] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#8F3B22] transition-colors cursor-pointer"
                          >
                            <Plus size={14} /> Add Dress Code Item
                          </button>
                        </div>

                        {(editConfig.dressCode?.events || []).map((item, index) => (
                          <div key={index} className="bg-white p-4 rounded-xl border border-[#C9A45C]/30 space-y-3 relative shadow-xs">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={item.event}
                                onChange={e => {
                                  const val = e.target.value;
                                  setEditConfig(c => {
                                    const evs = [...(c.dressCode?.events || [])];
                                    evs[index] = { ...evs[index], event: val };
                                    return { ...c, dressCode: { ...c.dressCode, enabled: c.dressCode?.enabled ?? true, events: evs } };
                                  });
                                }}
                                className="flex-1 font-display text-xs font-bold text-[#641D2E] border border-[#C9A45C]/30 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#B94E2F]"
                                placeholder="e.g. On Reception"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEditConfig(c => {
                                    const evs = [...(c.dressCode?.events || [])];
                                    evs.splice(index, 1);
                                    return { ...c, dressCode: { ...c.dressCode, enabled: c.dressCode?.enabled ?? true, events: evs } };
                                  });
                                }}
                                className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove Dress Code Item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-[#765E52] mb-1 uppercase tracking-wide">
                                Instructions (one per line)
                              </label>
                              <textarea
                                value={(item.instructions || []).join("\n")}
                                onChange={e => {
                                  const lines = e.target.value.split("\n").map(l => l.trim()).filter(Boolean);
                                  setEditConfig(c => {
                                    const evs = [...(c.dressCode?.events || [])];
                                    evs[index] = { ...evs[index], instructions: lines };
                                    return { ...c, dressCode: { ...c.dressCode, enabled: c.dressCode?.enabled ?? true, events: evs } };
                                  });
                                }}
                                className="w-full bg-[#FFF9F3]/60 border border-[#C9A45C]/30 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#B94E2F] h-16"
                                placeholder="Avoid blue and black"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* HOTEL & STAY TAB */}
                {activeTab === "hotel_stay" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-6">
                    <div className="bg-[#FFF9F3]/70 p-5 rounded-2xl border border-[#C9A45C]/30 space-y-5">
                      <div className="flex items-center justify-between border-b border-[#C9A45C]/20 pb-3">
                        <h4 className="text-sm font-bold text-[#641D2E] flex items-center gap-2 uppercase tracking-widest">
                          <Building2 size={18} className="text-[#dec47f]" /> Hotel & Stay Information
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#641D2E]">
                          <input 
                            type="checkbox"
                            checked={editConfig.hotelStay?.enabled ?? true}
                            onChange={e => setEditConfig(c => ({...c, hotelStay: {...c.hotelStay, enabled: e.target.checked}}))}
                            className="w-4 h-4 rounded text-[#B94E2F]"
                          />
                          Enable Section
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Resort / Venue Name</label>
                          <input 
                            type="text" 
                            value={editConfig.hotelStay?.hotelName || ''}
                            onChange={e => setEditConfig(c => ({...c, hotelStay: {...c.hotelStay, hotelName: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Mountain Breeze Mahableshwar"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Tagline / Headline</label>
                          <input 
                            type="text" 
                            value={editConfig.hotelStay?.tagline || ''}
                            onChange={e => setEditConfig(c => ({...c, hotelStay: {...c.hotelStay, tagline: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Guest Accommodations & Valley Retreat"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Check-in Time</label>
                          <input 
                            type="text" 
                            value={editConfig.hotelStay?.checkIn || ''}
                            onChange={e => setEditConfig(c => ({...c, hotelStay: {...c.hotelStay, checkIn: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="12:00 PM (Jan 18, 2027)"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Check-out Time</label>
                          <input 
                            type="text" 
                            value={editConfig.hotelStay?.checkOut || ''}
                            onChange={e => setEditConfig(c => ({...c, hotelStay: {...c.hotelStay, checkOut: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="11:00 AM (Jan 19, 2027)"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Full Address</label>
                        <textarea 
                          value={editConfig.hotelStay?.address || ''}
                          onChange={e => setEditConfig(c => ({...c, hotelStay: {...c.hotelStay, address: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F] h-18"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Google Maps Navigation Link</label>
                        <input 
                          type="text" 
                          value={editConfig.hotelStay?.googleMapsUrl || ''}
                          onChange={e => setEditConfig(c => ({...c, hotelStay: {...c.hotelStay, googleMapsUrl: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                          placeholder="https://www.google.com/maps/place/..."
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Accommodations & Room Arrangements</label>
                        <textarea 
                          value={editConfig.hotelStay?.roomInfo || ''}
                          onChange={e => setEditConfig(c => ({...c, hotelStay: {...c.hotelStay, roomInfo: e.target.value}}))}
                          className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F] h-20"
                          placeholder="Comfortable private cottages and valley-view rooms have been reserved for all our guests."
                        />
                      </div>

                      {/* Assistance Contacts */}
                      <div className="bg-white p-4 rounded-xl border border-[#C9A45C]/30 space-y-4">
                        <label className="block text-[11px] font-bold text-[#641D2E] uppercase tracking-wide">
                          Hospitality Assistance Contacts
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#FFF9F3]/60 p-3 rounded-lg border border-[#C9A45C]/20">
                            <span className="text-xs font-bold text-[#641D2E] block mb-1">Contact 1</span>
                            <span className="text-xs text-[#4B3A35] font-semibold block">Mr. Vishal V</span>
                            <span className="text-xs text-[#B94E2F] font-mono">+91 7400052735</span>
                          </div>
                          <div className="bg-[#FFF9F3]/60 p-3 rounded-lg border border-[#C9A45C]/20">
                            <span className="text-xs font-bold text-[#641D2E] block mb-1">Contact 2</span>
                            <span className="text-xs text-[#4B3A35] font-semibold block">Ms. Priti K</span>
                            <span className="text-xs text-[#B94E2F] font-mono">+91 7208782729</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* RSVP TAB */}
                {activeTab === "rsvp" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-6">
                    {/* RSVP Form Configuration */}
                    <div className="bg-[#FFF9F3]/70 p-5 rounded-2xl border border-[#C9A45C]/30 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#C9A45C]/20 pb-3">
                        <h4 className="text-sm font-bold text-[#641D2E] flex items-center gap-2 uppercase tracking-widest">
                          <MessageSquare size={18} className="text-[#dec47f]" /> RSVP Form Settings
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#641D2E]">
                          <input 
                            type="checkbox"
                            checked={editConfig.rsvpSection?.enabled ?? true}
                            onChange={e => setEditConfig(c => ({...c, rsvpSection: {...c.rsvpSection, enabled: e.target.checked}}))}
                            className="w-4 h-4 rounded text-[#B94E2F]"
                          />
                          Enable RSVP Section
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Section Title</label>
                          <input 
                            type="text" 
                            value={editConfig.rsvpSection?.title || ''}
                            onChange={e => setEditConfig(c => ({...c, rsvpSection: {...c.rsvpSection, title: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Kindly Respond (RSVP)"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Deadline Notice</label>
                          <input 
                            type="text" 
                            value={editConfig.rsvpSection?.deadlineText || ''}
                            onChange={e => setEditConfig(c => ({...c, rsvpSection: {...c.rsvpSection, deadlineText: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Please confirm your attendance by December 15, 2026"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Coordinator Name</label>
                          <input 
                            type="text" 
                            value={editConfig.rsvpSection?.contactName || ''}
                            onChange={e => setEditConfig(c => ({...c, rsvpSection: {...c.rsvpSection, contactName: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="Family RSVP Desk"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Coordinator WhatsApp / Phone</label>
                          <input 
                            type="text" 
                            value={editConfig.rsvpSection?.contactPhone || ''}
                            onChange={e => setEditConfig(c => ({...c, rsvpSection: {...c.rsvpSection, contactPhone: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wide">Google Form RSVP URL</label>
                          <input 
                            type="text" 
                            value={editConfig.rsvpSection?.googleFormUrl || ''}
                            onChange={e => setEditConfig(c => ({...c, rsvpSection: {...c.rsvpSection, googleFormUrl: e.target.value}}))}
                            className="w-full bg-white border border-[#C9A45C]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                            placeholder="https://docs.google.com/forms/d/..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submitted RSVPs List */}
                    <div className="bg-white p-5 rounded-2xl border-2 border-[#C9A45C]/40 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#C9A45C]/20 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#641D2E] flex items-center gap-2 uppercase tracking-widest">
                            <Users size={18} className="text-[#B94E2F]" />
                            Guest RSVP Submissions ({currentWorkspace})
                          </h4>
                          <p className="text-xs text-[#765E52] mt-0.5">
                            Total Responses: <span className="font-bold text-[#B94E2F]">{rsvpsList.length}</span> • Confirmed Attending Headcount:{" "}
                            <span className="font-bold text-emerald-700">
                              {rsvpsList.filter(r => r.attending !== false).reduce((sum, r) => sum + (Number(r.guestsCount) || 1), 0)} guests
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={loadRsvps}
                            disabled={isLoadingRsvps}
                            className="bg-[#FFF9F3] border border-[#C9A45C]/40 hover:bg-[#F5EDD6] text-[#641D2E] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <RefreshCw size={13} className={isLoadingRsvps ? "animate-spin" : ""} /> Refresh
                          </button>
                          {rsvpsList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to clear all RSVPs for this workspace?")) {
                                  clearAllLocalRsvps(currentWorkspace);
                                  setRsvpsList([]);
                                }
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>

                      {isLoadingRsvps ? (
                        <div className="py-12 flex justify-center items-center gap-2 text-sm text-[#765E52]">
                          <Loader2 size={18} className="animate-spin text-[#B94E2F]" /> Loading RSVPs...
                        </div>
                      ) : rsvpsList.length === 0 ? (
                        <div className="py-12 text-center text-sm text-[#765E52] bg-[#FFF9F3]/30 rounded-xl border border-dashed border-[#C9A45C]/30">
                          No RSVP submissions received yet for this workspace. Responses will appear here in real time.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rsvpsList.map((rsvp) => (
                            <div key={rsvp.id} className="bg-[#FFF9F3]/40 border border-[#C9A45C]/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-[#4B3A35]">{rsvp.name}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rsvp.attending !== false ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                    {rsvp.attending !== false ? `Attending (${rsvp.guestsCount || 1} guest${Number(rsvp.guestsCount) > 1 ? "s" : ""})` : "Cannot Attend"}
                                  </span>
                                </div>
                                <div className="text-xs text-[#765E52] flex items-center gap-3">
                                  <span>📞 {rsvp.phone}</span>
                                  <span>🗓️ {rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleDateString() : "Just now"}</span>
                                </div>
                                {rsvp.message && (
                                  <p className="text-xs italic text-[#641D2E] bg-white/80 p-2 rounded-lg border border-[#C9A45C]/20 mt-1">
                                    "{rsvp.message}"
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteLocalRsvp(rsvp.id);
                                  setRsvpsList(list => list.filter(item => item.id !== rsvp.id));
                                }}
                                className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors text-xs font-semibold"
                                title="Delete RSVP"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* EVENTS TAB */}
                {activeTab === "events" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-6">
                    <div className="bg-[#FFF9F3]/50 p-5 rounded-2xl border border-[#C9A45C]/20 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-[#4B3A35] flex items-center gap-2 uppercase tracking-widest">
                          Sacred Ceremonies
                        </h4>
                        <button
                          onClick={() => {
                            const newEvents = [...(editConfig.weddingEvents || [])];
                            newEvents.push({
                              eventName: "New Event",
                              time: "",
                              venueName: "Venue Name",
                              venueAddress: "Venue Address",
                              mapEmbedUrl: "",
                              mapDirectionsUrl: "",
                              thumbnailUrl: ""
                            });
                            setEditConfig(c => ({...c, weddingEvents: newEvents}));
                          }}
                          className="bg-[#B94E2F] hover:bg-[#8F3B22] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
                        >
                          + Add Event
                        </button>
                      </div>

                      {/* Event Address & Google Maps Visibility Toggle */}
                      <div className="bg-white p-4 rounded-xl border border-[#C9A45C]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-[#641D2E] uppercase tracking-wider block">
                            Event Venue Address &amp; Google Maps Button
                          </span>
                          <span className="text-[11px] text-[#765E52]">
                            Status: <strong className={editConfig.showEventAddressAndMap ? "text-emerald-700" : "text-[#B94E2F]"}>
                              {editConfig.showEventAddressAndMap ? "Visible (Unhidden on cards)" : "Hidden from cards"}
                            </strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditConfig(c => ({...c, showEventAddressAndMap: !c.showEventAddressAndMap}))}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                            editConfig.showEventAddressAndMap
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-[#641D2E] text-white hover:bg-[#85253C]"
                          }`}
                        >
                          {editConfig.showEventAddressAndMap ? "✓ Address & Map Unhidden (Click to Hide)" : "Hidden (Click to Unhide)"}
                        </button>
                      </div>

                      {editConfig.weddingEvents?.map((event, index) => (
                        <div key={index} className="bg-white border border-[#C9A45C]/30 p-5 rounded-2xl relative shadow-sm">
                          <button
                            onClick={() => {
                              const newEvents = [...editConfig.weddingEvents];
                              newEvents.splice(index, 1);
                              setEditConfig(c => ({...c, weddingEvents: newEvents}));
                            }}
                            className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-full transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wider">Event Name</label>
                              <input 
                                value={event.eventName} 
                                onChange={e => {
                                  const newEvents = [...editConfig.weddingEvents];
                                  newEvents[index].eventName = e.target.value;
                                  setEditConfig(c => ({...c, weddingEvents: newEvents}));
                                }}
                                className="w-full bg-[#FFF9F3]/50 border border-[#C9A45C]/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wider">Date</label>
                              <input 
                                type="date"
                                value={event.time} 
                                onChange={e => {
                                  const newEvents = [...editConfig.weddingEvents];
                                  newEvents[index].time = e.target.value;
                                  setEditConfig(c => ({...c, weddingEvents: newEvents}));
                                }}
                                className="w-full bg-[#FFF9F3]/50 border border-[#C9A45C]/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wider">Media URL (Video MP4/WEBM or Image)</label>
                              <input 
                                value={event.thumbnailUrl || ''} 
                                onChange={e => {
                                  const newEvents = [...editConfig.weddingEvents];
                                  newEvents[index].thumbnailUrl = e.target.value;
                                  setEditConfig(c => ({...c, weddingEvents: newEvents}));
                                }}
                                placeholder="https://... video.mp4"
                                className="w-full bg-[#FFF9F3]/50 border border-[#C9A45C]/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wider">Venue Details</label>
                              <input 
                                value={event.venueName} 
                                onChange={e => {
                                  const newEvents = [...editConfig.weddingEvents];
                                  newEvents[index].venueName = e.target.value;
                                  setEditConfig(c => ({...c, weddingEvents: newEvents}));
                                }}
                                placeholder="Venue Name"
                                className="w-full bg-[#FFF9F3]/50 border border-[#C9A45C]/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F] mb-3"
                              />
                              <input 
                                value={event.venueAddress} 
                                onChange={e => {
                                  const newEvents = [...editConfig.weddingEvents];
                                  newEvents[index].venueAddress = e.target.value;
                                  setEditConfig(c => ({...c, weddingEvents: newEvents}));
                                }}
                                placeholder="Address"
                                className="w-full bg-[#FFF9F3]/50 border border-[#C9A45C]/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-semibold text-[#765E52] mb-1.5 uppercase tracking-wider">Map Link (View on Maps button)</label>
                              <input 
                                value={event.mapDirectionsUrl || ''} 
                                onChange={e => {
                                  const newEvents = [...editConfig.weddingEvents];
                                  newEvents[index].mapDirectionsUrl = e.target.value;
                                  setEditConfig(c => ({...c, weddingEvents: newEvents}));
                                }}
                                placeholder="https://maps.google.com/..."
                                className="w-full bg-[#FFF9F3]/50 border border-[#C9A45C]/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!editConfig.weddingEvents || editConfig.weddingEvents.length === 0) && (
                        <div className="text-center p-8 bg-white/50 rounded-2xl border-2 border-dashed border-[#C9A45C]/40 text-[#765E52] text-sm">
                          No events added yet. Click "+ Add Event" to get started.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ASSETS TAB */}
                {activeTab === "assets" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col pb-6">
                    <AssetManager />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-[#641D2E] text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border border-[#C9A45C]/30"
          >
            <CheckCircle2 size={18} className="text-[#C9A45C]" />
            Changes Saved Successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};
