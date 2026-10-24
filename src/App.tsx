import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FirestoreImage } from "./components/FirestoreImage";
import { fetchFromFsdb } from "./lib/fsdb";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronUp, ChevronLeft, ChevronRight,
  Heart,
  Send,
  Users,
  Phone,
  User,
  MessageSquare,
  Volume2,
  VolumeX,
  Lock,
  Settings,
  ExternalLink,
  Instagram,
  Facebook,
  Maximize2,
  Flower2,
  Pencil,
  Sparkles,
  CheckCircle2,
  Building2,
  Bed,
  Coffee,
  Car,
  Navigation,
  Shirt,
  Eye,
  EyeOff,
  ShieldCheck
} from "lucide-react";

import { weddingConfig as defaultWeddingConfig, WeddingConfig } from "./weddingConfig";
import { GaneshaIcon } from "./components/GaneshaIcon";
import { OrnateFrame } from "./components/OrnateFrame";
import { EnvelopeCover } from "./components/EnvelopeCover";
import { RSVPModal } from "./components/RSVPModal";
import { AdminPanel } from "./components/AdminPanel";
import { ScratchReveal } from "./components/ScratchReveal";
import { FallingFlowers } from "./components/FallingFlowers";
import { FallingPetals } from "./components/FallingPetals";
import { SectionSeparator } from "./components/SectionSeparator";
import { Countdown } from "./components/Countdown";
import { Preloader } from "./components/Preloader";
import { EditInvitationModal } from "./components/EditInvitationModal";
import confetti from "canvas-confetti";
import { getActiveWorkspace } from "./lib/clientWorkspace";

import { saveConfigToDb, addRsvpToDb, fetchConfigFromDb } from "./lib/db";

const TurbanIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 4C8 4 5 7 5 11C5 12 5.5 13.5 7 15L12 17L17 15C18.5 13.5 19 12 19 11C19 7 16 4 12 4Z" fill="currentColor" opacity="0.9"/>
    <path d="M7 15C6 16 5 17 5 19C5 21 8 22 12 22C16 22 19 21 19 19C19 17 18 16 17 15L12 17L7 15Z" fill="currentColor" opacity="0.7"/>
    <path d="M12 4L13.5 1L12 2L10.5 1L12 4Z" fill="#dec47f" />
    <circle cx="12" cy="8" r="2" fill="#dec47f" />
  </svg>
);

const BindiIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="14" r="3.5" fill="#dc2626" />
    <circle cx="12" cy="7" r="1.5" fill="currentColor" />
    <circle cx="12" cy="3" r="1" fill="currentColor" />
    <circle cx="17" cy="11" r="1" fill="currentColor" />
    <circle cx="7" cy="11" r="1" fill="currentColor" />
  </svg>
);

export default function App() {
  // Config state for dynamic management
  const [config, setConfig] = useState<WeddingConfig>(() => {
    try {
      const stored = localStorage.getItem("wedding_config");
      if (stored) {
        const configData = JSON.parse(stored);
        return {
          ...defaultWeddingConfig,
          ...configData,
          weddingEvents: Array.isArray(configData.weddingEvents) ? configData.weddingEvents : defaultWeddingConfig.weddingEvents,
          galleryImages: configData.galleryImages || defaultWeddingConfig.galleryImages,
          groom: { ...defaultWeddingConfig.groom, ...(configData.groom || {}) },
          bride: { ...defaultWeddingConfig.bride, ...(configData.bride || {}) },
        };
      }
    } catch (e) {
      console.warn("Failed to load config from localStorage", e);
    }
    return defaultWeddingConfig;
  });

  const [isPreloading, setIsPreloading] = useState(true);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    // 1. Fetch permanent config from backend server on mount
    fetchConfigFromDb().then((serverConfig) => {
      if (serverConfig) {
        setConfig({
          ...defaultWeddingConfig,
          ...serverConfig,

          weddingEvents: Array.isArray(serverConfig.weddingEvents) ? serverConfig.weddingEvents : defaultWeddingConfig.weddingEvents,
          galleryImages: serverConfig.galleryImages || defaultWeddingConfig.galleryImages,
          groom: { ...defaultWeddingConfig.groom, ...(serverConfig.groom || {}) },
          bride: { ...defaultWeddingConfig.bride, ...(serverConfig.bride || {}) },
        });
      }
      setIsConfigLoaded(true);
    });
    
    // Fallback if DB fetch takes too long
    const timeoutId = setTimeout(() => setIsConfigLoaded(true), 3500);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Synchronize configuration changes across instances/tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "wedding_config" && e.newValue) {
        try {
          const configData = JSON.parse(e.newValue);
          setConfig({
            ...defaultWeddingConfig,
            ...configData,

            weddingEvents: Array.isArray(configData.weddingEvents) ? configData.weddingEvents : defaultWeddingConfig.weddingEvents,
            galleryImages: configData.galleryImages || defaultWeddingConfig.galleryImages,
            groom: { ...defaultWeddingConfig.groom, ...(configData.groom || {}) },
            bride: { ...defaultWeddingConfig.bride, ...(configData.bride || {}) },
          });
        } catch (err) {
          console.warn("Failed to parse storage update", err);
        }
      }
    };
    
    // Custom event to handle updates within the same window
    const handleLocalConfigUpdate = () => {
      try {
        const stored = localStorage.getItem("wedding_config");
        if (stored) {
          const configData = JSON.parse(stored);
          setConfig({
            ...defaultWeddingConfig,
            ...configData,

            weddingEvents: Array.isArray(configData.weddingEvents) ? configData.weddingEvents : defaultWeddingConfig.weddingEvents,
            galleryImages: configData.galleryImages || defaultWeddingConfig.galleryImages,
            groom: { ...defaultWeddingConfig.groom, ...(configData.groom || {}) },
            bride: { ...defaultWeddingConfig.bride, ...(configData.bride || {}) },
          });
        }
      } catch (err) {
        console.warn("Failed to parse local config update", err);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wedding_config_updated", handleLocalConfigUpdate);
    window.addEventListener("client_workspace_changed", async (e: Event) => {
      const customEv = e as CustomEvent<{ workspaceName: string; safeId: string }>;
      const ws = customEv.detail?.workspaceName;
      if (ws) {
        console.log(`[App] Client workspace changed to "${ws}", fetching isolated data...`);
        const clientConfig = await fetchConfigFromDb(ws);
        if (clientConfig) {
          setConfig({
            ...defaultWeddingConfig,
            ...clientConfig,
            weddingEvents: Array.isArray(clientConfig.weddingEvents) ? clientConfig.weddingEvents : defaultWeddingConfig.weddingEvents,
            galleryImages: clientConfig.galleryImages || defaultWeddingConfig.galleryImages,
            groom: { ...defaultWeddingConfig.groom, ...(clientConfig.groom || {}) },
            bride: { ...defaultWeddingConfig.bride, ...(clientConfig.bride || {}) },
          });
        }
      }
    });
    


  return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wedding_config_updated", handleLocalConfigUpdate);
    };
  }, []);

  const handleConfigChange = async (newConfig: WeddingConfig) => {
    setConfig(newConfig);
    try {
      await saveConfigToDb(newConfig);
    } catch (e) {
      console.warn("Failed to save config.", e);
      alert("Failed to save changes: " + (e instanceof Error ? e.message : String(e)));
      throw e;
    }
  };

  // Opening flow states
  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const date = new Date(dateStr);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const trueDate = new Date(date.getTime() + userTimezoneOffset);
      return trueDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return dateStr;
  };

  const [isOpened, setIsOpened] = useState(false);
  const [isDateRevealed, setIsDateRevealed] = useState(false);
  const [isMonthRevealed, setIsMonthRevealed] = useState(false);
  const [isYearRevealed, setIsYearRevealed] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);

  const allHeartsScratched = isDateRevealed && isMonthRevealed && isYearRevealed;
  const musicPlayingRef = useRef(musicPlaying);
  
  // Parse wedding date parts safely
  const dObj = new Date(config.weddingDate);
  let dateOfMarry = "12th";
  let monthOfMarry = "December";
  let yearOfMarry = "2026";

  if (!isNaN(dObj.getTime())) {
    const dayNum = dObj.getDate();
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    dateOfMarry = getOrdinal(dayNum);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthOfMarry = months[dObj.getMonth()];
    yearOfMarry = dObj.getFullYear().toString();
  } else if (config.displayDate) {
    const cleaned = config.displayDate.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*/i, '');
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 3) {
      dateOfMarry = parts[0];
      monthOfMarry = parts[1].substring(0, 3);
      yearOfMarry = parts[2];
    }
  }
  
  useEffect(() => {
    musicPlayingRef.current = musicPlaying;
  }, [musicPlaying]);

  // Celebration animation when hearts are scratched
  useEffect(() => {
    if (allHeartsScratched) {
      const duration = 4000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 8,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.8 },
          colors: ['#fcd34d', '#f87171', '#c084fc', '#f472b6', '#ffffff']
        });
        confetti({
          particleCount: 8,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.8 },
          colors: ['#fcd34d', '#f87171', '#c084fc', '#f472b6', '#ffffff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [allHeartsScratched]);



  // RSVP Form states
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [rsvpGuests, setRsvpGuests] = useState(1);
  const [rsvpAttend, setRsvpAttend] = useState<boolean | null>(true); // default attending
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [showRsvpModal, setShowRsvpModal] = useState(false);

  // Host Dashboard / Admin state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [actualMusicUrl, setActualMusicUrl] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState<"edit" | "admin" | "rsvp">("edit");
  const [adminInitialTab, setAdminInitialTab] = useState<"workspace" | "couple" | "story" | "dress_code" | "hotel_stay" | "rsvp" | "events" | "cover" | "assets">("couple");
  const [adminPanelTitle, setAdminPanelTitle] = useState("Edit Panel");

  // Admin Panel Login (Password: 6396)
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPwd, setAdminPwd] = useState("");
  const [adminLoginError, setAdminLoginError] = useState(false);

  // Edit Panel Login (Password: 2580)
  const [showEditLogin, setShowEditLogin] = useState(false);
  const [editPwd, setEditPwd] = useState("");
  const [editLoginError, setEditLoginError] = useState(false);

  // RSVP View modal & password states (just below RSVP section, Password: 2580)
  const [showRsvpViewLogin, setShowRsvpViewLogin] = useState(false);
  const [rsvpViewPwd, setRsvpViewPwd] = useState("");
  const [rsvpViewLoginError, setRsvpViewLoginError] = useState(false);

  // Floating Edit Invitation button visibility state (can only be unhidden from Admin Panel)
  const [showFloatingEditInvitation, setShowFloatingEditInvitation] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("show_floating_edit_invitation");
      return stored === "true";
    } catch {
      return false;
    }
  });
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Pause background music helper
  const pauseMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setMusicPlaying(false);
  };

  // Automatically pause music if user exits the tab, switches apps, or page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseMusic();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
    };
  }, []);

  // Handle Audio Player
  useEffect(() => {
    let isCancelled = false;

    if (!config.musicUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActualMusicUrl("");
      return;
    }

    const loadAudio = async () => {
      try {
        let url = await fetchFromFsdb(config.musicUrl);
        if (isCancelled || !url) return;
        
        // Convert data URL to Blob URL for better audio playback support
        if (url.startsWith("data:audio")) {
          try {
            const parts = url.split(",");
            const mime = parts[0].match(/:(.*?);/)[1];
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            url = URL.createObjectURL(blob);
          } catch (e) {
            console.warn("Failed to convert audio base64 to blob", e);
          }
        }
        
        setActualMusicUrl(url);
      } catch (e) {
        console.log("Failed to load audio", e);
      }
    };
    loadAudio();

    return () => {
      isCancelled = true;
    };
  }, [config.musicUrl]);

  // Handle auto-play when url changes and it should be playing
  useEffect(() => {
    if (actualMusicUrl && musicPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    }
  }, [actualMusicUrl, musicPlaying]);

  // Handle Scroll Progress & Scroll-to-Top visibility
  useEffect(() => {
    const handleScroll = () => {
      // Show scroll-to-top button after 500px scroll
      setShowScrollTop(window.scrollY > 500);

      // Scroll progress percentage
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const handleStartMusic = () => {
    setMusicPlaying(true);
    // Try to auto-play background shehnai music
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setMusicPlaying(true))
        .catch((error) => {
          console.log("Audio play blocked by browser. User interaction should allow it.", error);
          // Set to playing state anyway so the user sees play toggle works on next action
          setMusicPlaying(true);
          // Retry playing on body tap
          const retryPlay = () => {
            audioRef.current?.play().then(() => {
              setMusicPlaying(true);
              document.body.removeEventListener("click", retryPlay);
            }).catch(e => {
              console.log("Retry play failed:", e);
              document.body.removeEventListener("click", retryPlay);
            });
          };
          document.body.addEventListener("click", retryPlay);
        });
    }
  };

  // Handle opening the envelope
  const handleOpenEnvelope = () => {
    setIsOpened(true);
  };

  // Toggle Background Music
  const toggleMusic = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (musicPlaying) {
      audioRef.current?.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current?.play()
        .then(() => setMusicPlaying(true))
        .catch(err => console.log("Could not play audio", err));
    }
  };

  // Scroll to target section smoothly
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle RSVP Submission
  const handleRSVPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim() || !rsvpPhone.trim() || rsvpAttend === null) {
      alert("Please fill in your Name, Phone Number, and RSVP Status.");
      return;
    }

    // Save RSVP to database (max 4 guests limit)
    const clampedGuests = Math.min(4, Math.max(1, rsvpGuests));
    const newRsvp = {
      name: rsvpName,
      phone: rsvpPhone,
      guestsCount: rsvpAttend ? clampedGuests : 0,
      attend: rsvpAttend,
      message: rsvpMessage,
      timestamp: new Date().toISOString()
    };

    addRsvpToDb(newRsvp)
      .then(() => {
        // Show Confirmation Modal
        setShowRsvpModal(true);
        if (rsvpAttend) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#dec47f', '#962325', '#f8d98d']
          });
        }
      })
      .catch(err => {
        console.warn("Error adding RSVP: ", err);
        alert("Failed to submit RSVP: " + (err instanceof Error ? err.message : String(err)));
      });
  };

  const handleModalClose = () => {
    setShowRsvpModal(false);
    // Reset RSVP Form (excluding attend status for UX)
    setRsvpName("");
    setRsvpPhone("");
    setRsvpGuests(1);
    setRsvpMessage("");
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!carouselRef.current || isHovering) return;
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carouselRef.current.scrollBy({ left: clientWidth > 600 ? 400 : 300, behavior: 'smooth' });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovering]);

  const scrollPrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -(carouselRef.current.clientWidth > 600 ? 400 : 300), behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: carouselRef.current.clientWidth > 600 ? 400 : 300, behavior: 'smooth' });
    }
  };
  return (
    <div className="min-h-[100dvh] bg-[#FFF8F3] bg-gradient-to-b from-[#FFF8F3] to-[#ffece0] font-sans relative text-gray-800">
      
      <AnimatePresence>
        {isPreloading && (
          <Preloader 
            config={isConfigLoaded ? config : null} 
            onComplete={() => setIsPreloading(false)} 
          />
        )}
      </AnimatePresence>

      <audio ref={audioRef} src={actualMusicUrl || undefined} loop preload="auto" playsInline className="hidden" onError={(e) => console.warn("Audio could not load.")} onPlay={() => console.log("Audio playing!")} />
      
      {/* 1. OVERLAY ENVELOPE COVER (Opening Screen) */}
      <AnimatePresence>
        {(!isOpened && !isPreloading) && (
          <EnvelopeCover
            key="envelope"
            isOpen={isOpened}
            onOpen={handleOpenEnvelope}
            onSealTap={handleStartMusic}
            openingBackgroundImageUrl={config.openingBackgroundImageUrl}
            openingSealImageUrl={config.openingSealImageUrl}
            openingVideoUrl={config.openingVideoUrl}
          />
        )}
      </AnimatePresence>

      {/* BACKGROUND DECORATIVE MANDALAS (for luxury depth) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-150px] w-[400px] h-[400px] rounded-full border border-gold-400/10 flex items-center justify-center">
          <div className="w-[300px] h-[300px] rounded-full border border-dashed border-gold-400/5 animate-[spin_120s_linear_infinite]" />
        </div>
        <div className="absolute top-[50%] right-[-150px] w-[400px] h-[400px] rounded-full border border-gold-400/10 flex items-center justify-center">
          <div className="w-[300px] h-[300px] rounded-full border border-dashed border-gold-400/5 animate-[spin_100s_linear_reverse_infinite]" />
        </div>
        <div className="absolute bottom-[10%] left-[-100px] w-[300px] h-[300px] rounded-full border border-gold-400/5" />
      </div>

      {/* SCROLL PROGRESS INDICATOR BAR */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-200 z-50 shadow-md transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* MAIN LAYOUT WRAPPER (Fade in after envelope opens) */}
      
      <div className={`${isOpened ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity duration-1000 relative z-10 bg-[#FFF9F3] text-[#4B3A35] font-serif-premium`}>
        
        {/* Subtle Paper Texture SVG Filter */}
        <div className="fixed inset-0 opacity-[0.25] pointer-events-none z-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}></div>

        {/* Global Falling Petals */}
        <FallingPetals active={config.heroSettings?.showPetals ?? true} count={30} className="z-[100] pointer-events-none fixed" />

        {/* 1. HERO / WEDDING INTRODUCTION */}
        <section id="hero" className="relative min-h-[100dvh] w-full max-w-[calc(100dvh*9/16)] mx-auto flex flex-col justify-center items-center text-center px-6 py-16 overflow-hidden">
          
          {/* Background Video/Color */}
          {config.heroSettings?.bgVideoUrl ? (
            <div className="absolute inset-0 z-0">
              <video 
                src={config.heroSettings.bgVideoUrl} 
                className="w-full h-full object-cover opacity-80"
                autoPlay 
                loop 
                muted 
                playsInline
              />
              <div className="absolute inset-0 bg-[#FFF9F3]/30 mix-blend-overlay pointer-events-none" />
            </div>
          ) : (
            <div className="absolute inset-0 pointer-events-none opacity-40 flex flex-col justify-between z-0">
              <div className="w-full h-40 bg-gradient-to-b from-[#FFF9F3] to-transparent z-10 absolute top-0" />
              <div className="absolute top-[-30px] left-[-30px] w-64 h-64 bg-[radial-gradient(circle_at_center,#B94E2F_0%,transparent_60%)] mix-blend-multiply blur-3xl opacity-20" />
              <div className="absolute bottom-[-30px] right-[-30px] w-64 h-64 bg-[radial-gradient(circle_at_center,#C9A45C_0%,transparent_60%)] mix-blend-multiply blur-3xl opacity-20" />
            </div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
            className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center bg-white/75 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#C9A45C]/40 my-auto"
          >
            {/* Corner Decorative Lines */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-[#C9A45C]/60 rounded-tl-xl" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-[#C9A45C]/60 rounded-tr-xl" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-[#C9A45C]/60 rounded-bl-xl" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-[#C9A45C]/60 rounded-br-xl" />

            {/* Ganesha Motif or Image */}
            <div className="w-16 h-16 flex items-center justify-center mb-5 text-[#B94E2F]">
              {config.heroSettings?.ganeshaIconUrl ? (
                <img src={config.heroSettings.ganeshaIconUrl} alt="Ganesha" className="w-full h-full object-contain" />
              ) : (
                <GaneshaIcon className="w-14 h-14 opacity-90" />
              )}
            </div>

            {/* Shloka */}
            {config.heroSettings?.shloka && (
              <div className="mb-8 whitespace-pre-line text-xs text-[#C9A45C] font-semibold tracking-wider leading-relaxed">
                {config.heroSettings.shloka}
              </div>
            )}

            {/* Intro Text */}
            <p className="text-[#4B3A35] max-w-[95%] mx-auto text-[13px] md:text-sm leading-relaxed mb-10 italic">
              {config.heroSettings?.introText || '"With the blessings of the Almighty & our respected elders,\nwe joyfully request your gracious presence on the wedding celebration of"'}
            </p>

            {/* Couple Names (Groom Priority) */}
            <div className="flex flex-col items-center w-full relative">
              {config.priorityOrder === "bride" ? (
                <>
                  {/* Bride First */}
                  <h1 className="font-accent text-5xl md:text-6xl text-[#B94E2F] m-0 font-normal leading-[1.2] tracking-wide">
                    {config.bride.name}
                  </h1>
                  <p className="text-[11px] md:text-xs text-[#765E52] mt-2 mb-6 uppercase tracking-widest text-center">
                    {config.heroSettings?.brideParents || config.bride.introLineage || `Daughter of ${config.bride.fatherName} & ${config.bride.motherName}`}
                  </p>
                  
                  {/* Separator */}
                  <div className="flex items-center justify-center gap-3 w-full mb-6">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#C9A45C]/50" />
                    <span className="font-accent text-3xl text-[#C9A45C]">&amp;</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#C9A45C]/50" />
                  </div>

                  {/* Groom Second */}
                  <h1 className="font-accent text-5xl md:text-6xl text-[#B94E2F] m-0 font-normal leading-[1.2] tracking-wide">
                    {config.groom.name}
                  </h1>
                  <p className="text-[11px] md:text-xs text-[#765E52] mt-2 mb-2 uppercase tracking-widest text-center">
                    {config.heroSettings?.groomParents || config.groom.introLineage || `Son of ${config.groom.fatherName} & ${config.groom.motherName}`}
                  </p>
                </>
              ) : (
                <>
                  {/* Groom First (Default & Priority) */}
                  <h1 className="font-accent text-5xl md:text-6xl text-[#B94E2F] m-0 font-normal leading-[1.2] tracking-wide">
                    {config.groom.name}
                  </h1>
                  <p className="text-[11px] md:text-xs text-[#765E52] mt-2 mb-6 uppercase tracking-widest text-center">
                    {config.heroSettings?.groomParents || config.groom.introLineage || `Son of ${config.groom.fatherName} & ${config.groom.motherName}`}
                  </p>
                  
                  {/* Separator */}
                  <div className="flex items-center justify-center gap-3 w-full mb-6">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#C9A45C]/50" />
                    <span className="font-accent text-3xl text-[#C9A45C]">&amp;</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#C9A45C]/50" />
                  </div>

                  {/* Bride Second */}
                  <h1 className="font-accent text-5xl md:text-6xl text-[#B94E2F] m-0 font-normal leading-[1.2] tracking-wide">
                    {config.bride.name}
                  </h1>
                  <p className="text-[11px] md:text-xs text-[#765E52] mt-2 mb-2 uppercase tracking-widest text-center">
                    {config.heroSettings?.brideParents || config.bride.introLineage || `Daughter of ${config.bride.fatherName} & ${config.bride.motherName}`}
                  </p>
                </>
              )}
            </div>
          </motion.div>
          
          {/* Scroll Prompt Arrow */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-6 z-10 flex flex-col items-center cursor-pointer select-none text-[#C9A45C] hover:text-[#B94E2F] transition-colors" 
            onClick={() => document.getElementById("scratch-reveal")?.scrollIntoView({behavior: "smooth"})}
          >
            <span className="font-sans text-[9px] uppercase tracking-[0.4em] mb-2 font-semibold">
              Scroll
            </span>
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-4 h-4 border-b-2 border-r-2 border-current rotate-45" 
            />
          </motion.div>
        </section>

        {/* Floral Section Separator */}
        <SectionSeparator />

        {/* 2. SAVE THE DATE & SCRATCH CARDS */}
        <motion.section 
          id="scratch-reveal" 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="min-h-[100dvh] w-full max-w-[calc(100dvh*9/16)] mx-auto flex flex-col justify-start pt-24 pb-20 items-center px-4 sm:px-6 relative z-10"
        >
          <div className="text-center mb-10 w-full">
            <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#C9A45C] font-bold mb-4 block">
              SAVE THE DATE
            </span>
            <h2 className="font-accent text-5xl sm:text-6xl text-[#B94E2F] leading-tight ">
              Reveal Our<br/>Big Day
            </h2>
            <p className="font-serif-premium italic text-[#4B3A35] mt-4 text-sm md:text-base">
              Scratch the heart to reveal
            </p>
          </div>

          {/* 3 Red Hearts container (Single Row) */}
          <div className="flex-1 flex flex-col justify-center w-full"><div className="flex flex-row flex-nowrap justify-center items-center gap-2 sm:gap-6 w-full max-w-lg mx-auto overflow-visible px-2">
            {/* Heart 1: Date */}
            <div className="flex flex-col items-center shrink min-w-0 w-1/3">
              <div className="flex-1 w-full max-w-[150px] aspect-[15/13] relative">
                <ScratchReveal
                  width={150}
                  height={130}
                  onReveal={() => setIsDateRevealed(true)}
                  content={
                    <div className={`w-full h-full flex items-center justify-center transition-all duration-500 ${
                      isDateRevealed 
                        ? "opacity-100 scale-100" 
                        : "opacity-0 scale-90"
                    }`}>
                      <span className="font-serif-premium text-4xl sm:text-5xl font-bold text-[#B94E2F]">
                        {dateOfMarry}
                      </span>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Heart 2: Month */}
            <div className="flex flex-col items-center shrink min-w-0 w-1/3">
              <div className="flex-1 w-full max-w-[150px] aspect-[15/13] relative flex justify-center items-center">
                <ScratchReveal
                  width={150}
                  height={130}
                  onReveal={() => setIsMonthRevealed(true)}
                  content={
                    <div className={`w-full h-full flex items-center justify-center transition-all duration-500 ${
                      isMonthRevealed 
                        ? "opacity-100 scale-100" 
                        : "opacity-0 scale-90"
                    }`}>
                      <span className="font-serif-premium text-3xl sm:text-4xl font-bold text-[#B94E2F] uppercase tracking-widest text-center">
                        {monthOfMarry}
                      </span>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Heart 3: Year */}
            <div className="flex flex-col items-center shrink min-w-0 w-1/3">
              <div className="flex-1 w-full max-w-[150px] aspect-[15/13] relative flex justify-center items-center">
                <ScratchReveal
                  width={150}
                  height={130}
                  onReveal={() => setIsYearRevealed(true)}
                  content={
                    <div className={`w-full h-full flex items-center justify-center transition-all duration-500 ${
                      isYearRevealed 
                        ? "opacity-100 scale-100" 
                        : "opacity-0 scale-90"
                    }`}>
                      <span className="font-serif-premium text-4xl sm:text-5xl font-bold text-[#B94E2F]">
                        {yearOfMarry}
                      </span>
                    </div>
                  }
                />
              </div>
            </div>
          </div>

          </div>

          {/* COUNTDOWN REVEAL */}
          <AnimatePresence>
            {allHeartsScratched && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-12 sm:mt-16 text-center overflow-hidden w-full"
              >
                <div className="w-12 h-[1px] bg-[#C9A45C] mx-auto mb-8" />
                <span className="font-accent text-3xl text-[#B94E2F] block mb-6">
                  The start of a beautiful journey...
                </span>
                <Countdown targetDate={config.weddingDate} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Floral Section Separator */}
        {allHeartsScratched && config.weddingEvents?.length > 0 && <SectionSeparator />}

        {/* 3. SACRED CEREMONIES / EVENTS */}
        {allHeartsScratched && config.weddingEvents?.length > 0 && (
          <motion.section 
            id="events"
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="py-20 px-4 md:px-8 relative z-10 w-full max-w-[calc(100dvh*9/16)] mx-auto"
          >
            <div className="text-center mb-16">
              <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#C9A45C] font-bold mb-4 block">
                THE CELEBRATION UNFOLDS
              </span>
              <h2 className="font-accent text-5xl md:text-6xl text-[#B94E2F] ">
                Sacred<br/>Ceremonies
              </h2>
              <div className="flex items-center justify-center mt-6">
                <div className="w-16 h-[1px] bg-[#C9A45C]/50" />
                <div className="w-2 h-2 rotate-45 border border-[#C9A45C] mx-3" />
                <div className="w-16 h-[1px] bg-[#C9A45C]/50" />
              </div>
            </div>

            <div className="flex flex-col gap-20">
              {config.weddingEvents.map((event, index) => {
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center text-center"
                  >
                    <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#765E52] font-semibold mb-2">
                      {formatEventDate(event.time)}
                    </span>
                    <h3 className="font-accent text-5xl md:text-6xl text-[#B94E2F] mb-6">
                      {event.eventName}
                    </h3>
                    
                    {/* Media Card */}
                    {event.thumbnailUrl && (
                      <div className="relative w-full max-w-xs md:max-w-sm aspect-[9/16] rounded-2xl overflow-hidden shadow-[0_10px_40px_rgb(0,0,0,0.08)] mb-6 border border-white/50">
                        {event.thumbnailUrl?.endsWith('.mp4') || event.thumbnailUrl?.endsWith('.webm') ? (
                          <video 
                            src={event.thumbnailUrl} 
                            className="w-full h-full object-cover"
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                          />
                        ) : (
                          <FirestoreImage 
                            path={event.thumbnailUrl} 
                            alt={event.eventName}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                      </div>
                    )}

                    <p className="font-serif-premium text-[#4B3A35] text-sm md:text-base mb-6 px-4">
                      {event.venueName}, {event.venueAddress}
                    </p>
                    
                    {(event.mapDirectionsUrl || event.mapEmbedUrl) && (
                      <a 
                        href={event.mapDirectionsUrl || event.mapEmbedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={pauseMusic}
                        className="inline-flex flex-row items-center gap-2 bg-[#B94E2F] text-white px-6 py-2.5 rounded-full font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-[#8F3B22] transition-colors shadow-md cursor-pointer"
                      >
                        <MapPin size={12} />
                        VIEW ON MAPS
                      </a>
                    )}
                    
                    {/* Separator between events */}
                    {index !== config.weddingEvents.length - 1 && (
                      <div className="flex items-center justify-center mt-12 w-full opacity-60">
                        <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#C9A45C]" />
                        <div className="w-2 h-2 rotate-45 border border-[#C9A45C] mx-3" />
                        <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#C9A45C]" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Floral Section Separator */}
        {allHeartsScratched && <SectionSeparator />}

        {/* 4. INVITATION STORY / MESSAGE ("DIFFERENT ROOTS • SAME DREAMS") */}
        {allHeartsScratched && (
          <motion.section 
            id="story"
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="py-20 px-4 md:px-8 relative z-10 w-full max-w-[calc(100dvh*9/16)] mx-auto text-center"
          >
            <div className="mb-12">
              <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#C9A45C] font-bold mb-3 block">
                OUR SACRED JOURNEY
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#641D2E] font-bold uppercase tracking-[0.15em] leading-snug drop-shadow-sm px-2">
                {config.invitationStory?.title || "DIFFERENT ROOTS • SAME DREAMS"}
              </h2>
              <div className="flex items-center justify-center mt-5">
                <div className="w-16 h-[1px] bg-[#C9A45C]/50" />
                <div className="w-2 h-2 rotate-45 border border-[#C9A45C] mx-3" />
                <div className="w-16 h-[1px] bg-[#C9A45C]/50" />
              </div>
            </div>

            {/* Story Cards */}
            <div className="space-y-6 text-left">
              {/* Chapter 1: The Meeting */}
              <div className="bg-white/80 backdrop-blur-md border border-[#C9A45C]/40 p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 text-[#C9A45C]">
                  <Sparkles size={16} />
                  <span className="font-sans text-xs uppercase tracking-widest font-bold text-[#641D2E]">The Meeting</span>
                </div>
                <p className="font-serif-premium text-[#4B3A35] text-sm md:text-base leading-relaxed italic">
                  &quot;{config.invitationStory?.theMeeting || "Like a warm Kerala sunset and Assamese breeze our paths crossed and our life became more colourful."}&quot;
                </p>
              </div>

              {/* Chapter 2: The Journey */}
              <div className="bg-white/80 backdrop-blur-md border border-[#C9A45C]/40 p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 text-[#C9A45C]">
                  <Heart size={16} />
                  <span className="font-sans text-xs uppercase tracking-widest font-bold text-[#641D2E]">The Journey</span>
                </div>
                <p className="font-serif-premium text-[#4B3A35] text-sm md:text-base leading-relaxed italic">
                  &quot;{config.invitationStory?.theJourney || "What started as friendship grew into love filled with laughter long conversations, shared dreams and two beautiful cultures came together."}&quot;
                </p>
              </div>

              {/* Chapter 3: The Forever */}
              <div className="bg-gradient-to-br from-[#FFF9F3] to-[#FFF0E6] border border-[#C9A45C]/60 p-6 rounded-3xl shadow-md relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 text-[#B94E2F]">
                  <Flower2 size={16} />
                  <span className="font-sans text-xs uppercase tracking-widest font-bold text-[#B94E2F]">The Forever</span>
                </div>
                <p className="font-serif-premium text-[#4B3A35] text-sm md:text-base leading-relaxed italic">
                  &quot;{config.invitationStory?.theForever || "Today, as WE begin our next chapter, We invite you to be part of love, laughter and memories that will make our story forever even more special."}&quot;
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Floral Section Separator */}
        {allHeartsScratched && (config.dressCode?.enabled ?? true) && <SectionSeparator />}

        {/* 5. DRESS CODE / THEME SECTION */}
        {allHeartsScratched && (config.dressCode?.enabled ?? true) && (
          <motion.section 
            id="dress-code"
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="py-16 px-4 md:px-8 relative z-10 w-full max-w-[calc(100dvh*9/16)] mx-auto"
          >
            <div className="bg-white/85 backdrop-blur-xl border border-[#C9A45C]/40 rounded-[2.5rem] p-6 sm:p-8 shadow-lg relative overflow-hidden">
              <div className="text-center mb-6">
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#C9A45C] font-bold mb-2 block">
                  STYLE &amp; CELEBRATION
                </span>
                <h3 className="font-accent text-4xl sm:text-5xl text-[#B94E2F]">
                  {config.dressCode?.themeTitle || "Dress Code & Theme"}
                </h3>
                {config.dressCode?.themeSubtitle && (
                  <p className="font-serif-premium text-xs sm:text-sm text-[#765E52] mt-1 italic">
                    {config.dressCode.themeSubtitle}
                  </p>
                )}
              </div>

              {config.dressCode?.description && (
                <p className="text-center text-xs text-[#4B3A35] font-serif-premium mb-6 max-w-md mx-auto leading-relaxed">
                  {config.dressCode.description}
                </p>
              )}

              {/* Color Palette Swatches */}
              {config.dressCode?.colorPalette && config.dressCode.colorPalette.length > 0 && (
                <div className="mb-6">
                  <div className="text-center font-sans text-[10px] uppercase tracking-widest text-[#765E52] font-semibold mb-3">
                    Suggested Color Harmony
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-3">
                    {config.dressCode.colorPalette.map((color, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 group">
                        <div 
                          className="w-10 h-10 rounded-full shadow-md border-2 border-white ring-1 ring-[#C9A45C]/30 transition-transform group-hover:scale-110" 
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[9px] font-sans text-[#765E52] text-center max-w-[60px] truncate">
                          {color.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attire Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                <div className="bg-[#FFF9F3] border border-[#C9A45C]/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TurbanIcon className="w-5 h-5 text-[#B94E2F]" />
                    <span className="font-sans text-xs uppercase tracking-wider font-bold text-[#641D2E]">Gentlemen</span>
                  </div>
                  <p className="text-xs text-[#4B3A35] font-serif-premium leading-relaxed">
                    {config.dressCode?.attireMen || "Traditional Kerala Mundu with Gold Zari, Kurta Pajama, or Nehru Jacket in ivory or pastel shades."}
                  </p>
                </div>
                
                <div className="bg-[#FFF9F3] border border-[#C9A45C]/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BindiIcon className="w-5 h-5 text-[#B94E2F]" />
                    <span className="font-sans text-xs uppercase tracking-wider font-bold text-[#641D2E]">Ladies</span>
                  </div>
                  <p className="text-xs text-[#4B3A35] font-serif-premium leading-relaxed">
                    {config.dressCode?.attireWomen || "Traditional Kasavu Sarees, Assamese Mekhela Chador, Silk Sarees, or Lehengas in royal gold & warm hues."}
                  </p>
                </div>
              </div>

              {config.dressCode?.note && (
                <p className="text-[11px] text-center text-[#765E52] italic bg-[#FFF9F3]/60 py-2 px-4 rounded-xl border border-[#C9A45C]/20">
                  ✨ {config.dressCode.note}
                </p>
              )}
            </div>
          </motion.section>
        )}

        {/* Floral Section Separator */}
        {allHeartsScratched && (config.hotelStay?.enabled ?? true) && <SectionSeparator />}

        {/* 6. HOTEL & STAY INFO SECTION */}
        {allHeartsScratched && (config.hotelStay?.enabled ?? true) && (
          <motion.section 
            id="hotel-stay"
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="py-16 px-4 md:px-8 relative z-10 w-full max-w-[calc(100dvh*9/16)] mx-auto"
          >
            <div className="bg-white/85 backdrop-blur-xl border border-[#C9A45C]/40 rounded-[2.5rem] p-6 sm:p-8 shadow-lg relative overflow-hidden">
              <div className="text-center mb-6">
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#C9A45C] font-bold mb-2 block">
                  ACCOMMODATION &amp; TRAVEL
                </span>
                <h3 className="font-accent text-4xl sm:text-5xl text-[#B94E2F]">
                  {config.hotelStay?.hotelName || "Mountain Breeze Mahableshwar"}
                </h3>
                {config.hotelStay?.tagline && (
                  <p className="font-serif-premium text-xs sm:text-sm text-[#765E52] mt-1 italic">
                    {config.hotelStay.tagline}
                  </p>
                )}
              </div>

              {/* Check-In / Check-Out Badges */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#FFF9F3] border border-[#C9A45C]/30 p-3.5 rounded-2xl text-center">
                  <span className="block font-sans text-[9px] uppercase tracking-wider text-[#765E52] font-semibold">Check-In</span>
                  <span className="font-serif-premium text-xs sm:text-sm font-bold text-[#641D2E] mt-1 block">
                    {config.hotelStay?.checkIn || "18 Jan 2027 • 12:00 PM"}
                  </span>
                </div>
                <div className="bg-[#FFF9F3] border border-[#C9A45C]/30 p-3.5 rounded-2xl text-center">
                  <span className="block font-sans text-[9px] uppercase tracking-wider text-[#765E52] font-semibold">Check-Out</span>
                  <span className="font-serif-premium text-xs sm:text-sm font-bold text-[#641D2E] mt-1 block">
                    {config.hotelStay?.checkOut || "19 Jan 2027 • 11:00 AM"}
                  </span>
                </div>
              </div>

              {/* Address with Map Link */}
              <div className="bg-[#FFF9F3] border border-[#C9A45C]/30 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#B94E2F] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-sans text-[10px] uppercase tracking-wider font-bold text-[#641D2E] block mb-1">
                      Resort Address
                    </span>
                    <p className="text-xs text-[#4B3A35] font-serif-premium leading-relaxed mb-3">
                      {config.hotelStay?.address || "GP Milkat No 296 & 296/1, Panchgani - Mahabaleshwar Road, Tal, Metgutad, Mahabaleshwar, Maharashtra 412806"}
                    </p>
                    {config.hotelStay?.mapUrl && (
                      <a
                        href={config.hotelStay.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#B94E2F] hover:bg-[#8F3B22] text-white px-4 py-1.5 rounded-full text-[10px] font-sans uppercase tracking-wider font-bold transition-colors shadow-sm"
                      >
                        <Navigation size={12} />
                        Get Directions on Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Room details & Amenities */}
              {config.hotelStay?.roomDetails && (
                <div className="mb-6">
                  <p className="text-xs text-[#4B3A35] font-serif-premium leading-relaxed italic text-center">
                    &quot;{config.hotelStay.roomDetails}&quot;
                  </p>
                </div>
              )}

              {config.hotelStay?.amenities && config.hotelStay.amenities.length > 0 && (
                <div className="mb-6">
                  <div className="font-sans text-[10px] uppercase tracking-widest text-[#765E52] font-semibold mb-2.5 text-center">
                    Hospitality Highlights
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {config.hotelStay.amenities.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-[#4B3A35] bg-[#FFF9F3]/60 px-3 py-1.5 rounded-xl border border-[#C9A45C]/20 font-serif-premium">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Travel guide & Contact Helpline */}
              {config.hotelStay?.travelGuide && (
                <div className="text-[11px] text-[#765E52] bg-[#FFF9F3] p-3.5 rounded-2xl border border-[#C9A45C]/20 leading-relaxed mb-4">
                  <strong className="block text-[#641D2E] mb-1 font-sans text-[10px] uppercase tracking-wider">
                    🚗 Travel &amp; Transit Info
                  </strong>
                  {config.hotelStay.travelGuide}
                </div>
              )}

              {config.hotelStay?.contactPhone && (
                <div className="text-center pt-2">
                  <span className="text-[10px] text-[#765E52] font-sans uppercase tracking-wider block mb-1">
                    Hospitality Helpdesk
                  </span>
                  <a
                    href={`tel:${config.hotelStay.contactPhone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#B94E2F] hover:text-[#8F3B22] transition-colors"
                  >
                    <Phone size={13} />
                    {config.hotelStay.contactPerson ? `${config.hotelStay.contactPerson}: ` : ""}{config.hotelStay.contactPhone}
                  </a>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Floral Section Separator */}
        {allHeartsScratched && (config.rsvpSection?.enabled ?? true) && <SectionSeparator />}

        {/* 7. INTERACTIVE RSVP FORM SECTION */}
        {allHeartsScratched && (config.rsvpSection?.enabled ?? true) && (
          <motion.section 
            id="rsvp"
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="py-16 px-4 md:px-8 relative z-10 w-full max-w-[calc(100dvh*9/16)] mx-auto"
          >
            <div className="bg-white/85 backdrop-blur-xl border border-[#C9A45C]/40 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="text-center mb-8">
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#C9A45C] font-bold mb-2 block">
                  CELEBRATE WITH US
                </span>
                <h3 className="font-accent text-4xl sm:text-5xl text-[#B94E2F]">
                  {config.rsvpSection?.title || "Kindly RSVP"}
                </h3>
                <p className="font-serif-premium text-xs sm:text-sm text-[#765E52] mt-1 italic">
                  {config.rsvpSection?.subtitle || "Your blessings and presence mean the world to Aditya & Pooja"}
                </p>
                {config.rsvpSection?.deadlineText && (
                  <span className="inline-block mt-3 px-3.5 py-1 rounded-full bg-[#FFF9F3] border border-[#C9A45C]/40 text-[#641D2E] font-sans text-[10px] font-bold tracking-wide">
                    ⏳ {config.rsvpSection.deadlineText}
                  </span>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleRSVPSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#765E52] uppercase tracking-wide mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9A45C]" />
                    <input 
                      type="text" 
                      required
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-[#FFF9F3]/60 border border-[#C9A45C]/30 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#765E52] uppercase tracking-wide mb-1">
                    WhatsApp / Phone Number *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9A45C]" />
                    <input 
                      type="tel" 
                      required
                      value={rsvpPhone}
                      onChange={(e) => setRsvpPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#FFF9F3]/60 border border-[#C9A45C]/30 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#765E52] uppercase tracking-wide mb-1">
                      Will You Attend? *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRsvpAttend(true)}
                        className={`py-2 px-3 rounded-xl text-xs font-sans font-bold transition-all border ${
                          rsvpAttend === true
                            ? "bg-[#641D2E] text-[#dec47f] border-[#dec47f] shadow-sm"
                            : "bg-[#FFF9F3] text-[#765E52] border-[#C9A45C]/30 hover:bg-[#FFF0E6]"
                        }`}
                      >
                        ✓ Attending
                      </button>
                      <button
                        type="button"
                        onClick={() => setRsvpAttend(false)}
                        className={`py-2 px-3 rounded-xl text-xs font-sans font-bold transition-all border ${
                          rsvpAttend === false
                            ? "bg-[#641D2E] text-[#dec47f] border-[#dec47f] shadow-sm"
                            : "bg-[#FFF9F3] text-[#765E52] border-[#C9A45C]/30 hover:bg-[#FFF0E6]"
                        }`}
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  {rsvpAttend && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-[#765E52] uppercase tracking-wide">
                          Number of Guests
                        </label>
                        <span className="text-[10px] text-[#B94E2F] font-bold">Max 4 guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setRsvpGuests(num)}
                            className={`flex-1 py-2 rounded-xl text-xs font-sans font-bold transition-all border ${
                              rsvpGuests === num
                                ? "bg-[#B94E2F] text-white border-[#B94E2F]"
                                : "bg-[#FFF9F3] text-[#765E52] border-[#C9A45C]/30 hover:bg-[#FFF0E6]"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#765E52] uppercase tracking-wide mb-1">
                    Warm Wishes / Message for Couple
                  </label>
                  <div className="relative">
                    <MessageSquare size={15} className="absolute left-3.5 top-3 text-[#C9A45C]" />
                    <textarea 
                      value={rsvpMessage}
                      onChange={(e) => setRsvpMessage(e.target.value)}
                      placeholder="Share your blessings and love..."
                      rows={3}
                      className="w-full bg-[#FFF9F3]/60 border border-[#C9A45C]/30 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#B94E2F] resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#B94E2F] hover:bg-[#8F3B22] text-white py-3 rounded-xl text-sm font-bold uppercase tracking-widest font-sans shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2"
                >
                  <Send size={15} />
                  Submit RSVP
                </button>
              </form>

              {config.rsvpSection?.contactPhone && (
                <div className="mt-6 text-center border-t border-[#C9A45C]/20 pt-4">
                  <span className="text-[10px] text-[#765E52] font-sans block mb-1">
                    For RSVP assistance or queries:
                  </span>
                  <a
                    href={`tel:${config.rsvpSection.contactPhone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#641D2E] hover:text-[#B94E2F]"
                  >
                    <Phone size={12} />
                    {config.rsvpSection.contactName ? `${config.rsvpSection.contactName}: ` : ""}{config.rsvpSection.contactPhone}
                  </a>
                </div>
              )}

              {/* RSVP View Button Panel Just Below RSVP (Password 2580) */}
              <div className="mt-6 pt-5 border-t border-[#C9A45C]/25 text-center">
                {!showRsvpViewLogin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRsvpViewLogin(true);
                      setRsvpViewLoginError(false);
                      setRsvpViewPwd("");
                    }}
                    className="inline-flex items-center gap-2 bg-[#FFF9F3] hover:bg-[#F5EDD6] text-[#641D2E] border border-[#C9A45C]/50 px-4 py-2 rounded-xl text-xs font-sans font-bold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="View RSVP Submissions"
                  >
                    <Lock size={13} className="text-[#B94E2F]" />
                    <span>View RSVP Submissions</span>
                  </button>
                ) : (
                  <div className="max-w-xs mx-auto bg-[#FFF9F3] p-4 rounded-2xl border-2 border-[#C9A45C]/40 shadow-md space-y-2.5">
                    <p className="text-[11px] font-bold text-[#641D2E] uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Lock size={12} className="text-[#B94E2F]" /> Enter Host Password
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <input 
                        type="password"
                        value={rsvpViewPwd}
                        onChange={(e) => {
                          setRsvpViewPwd(e.target.value);
                          setRsvpViewLoginError(false);
                        }}
                        placeholder="Password (2580)"
                        className="px-3 py-1.5 text-xs rounded-lg border border-[#C9A45C]/50 focus:outline-none focus:border-[#B94E2F] text-center w-32 bg-white font-mono"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (rsvpViewPwd === "2580") {
                              setAdminMode("rsvp");
                              setAdminInitialTab("rsvp");
                              setAdminPanelTitle("RSVP Submissions");
                              setShowAdmin(true);
                              setShowRsvpViewLogin(false);
                              setRsvpViewPwd("");
                            } else {
                              setRsvpViewLoginError(true);
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (rsvpViewPwd === "2580") {
                            setAdminMode("rsvp");
                            setAdminInitialTab("rsvp");
                            setAdminPanelTitle("RSVP Submissions");
                            setShowAdmin(true);
                            setShowRsvpViewLogin(false);
                            setRsvpViewPwd("");
                          } else {
                            setRsvpViewLoginError(true);
                          }
                        }}
                        className="bg-[#B94E2F] hover:bg-[#8F3B22] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        View
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setShowRsvpViewLogin(false);
                          setRsvpViewPwd("");
                          setRsvpViewLoginError(false);
                        }}
                        className="text-[#765E52] px-2 py-1.5 rounded-lg text-xs hover:text-black transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    {rsvpViewLoginError && (
                      <p className="text-red-500 text-[10px] m-0 font-semibold">Incorrect password. Please enter 2580.</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </motion.section>
        )}

        {/* Floral Section Separator */}
        {allHeartsScratched && <SectionSeparator />}

        {/* 8. JOIN THE CELEBRATION & FINAL FOOTER */}
        {allHeartsScratched && (
          <>
            <motion.section
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }} 
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="py-20 px-6 text-center flex flex-col items-center bg-[#FFF9F3] relative z-10 w-full max-w-[calc(100dvh*9/16)] mx-auto"
            >
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#C9A45C] font-bold mb-4 block">
                JOIN THE CELEBRATION
              </span>
              <h2 className="font-accent text-5xl md:text-6xl text-[#B94E2F] mb-4">
                Celebrate<br/>With Us
              </h2>
              <p className="font-serif-premium text-[#765E52] max-w-lg mx-auto leading-relaxed text-sm md:text-base px-4">
                At last, the stars align, two beautiful cultures intertwine, and our next chapter begins. With hearts overflowing with gratitude, we warmly invite you to celebrate our wedding at Mountain Breeze Mahableshwar and bless our forever.
              </p>
            </motion.section>

            {/* Deep Burgundy Closing Section (Groom Priority) */}
            <motion.section
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }} 
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="py-24 px-6 text-center flex flex-col items-center bg-[#641D2E] relative z-10 overflow-hidden w-full max-w-[calc(100dvh*9/16)] mx-auto rounded-b-[40px] shadow-2xl"
            >
              {/* Decorative elements */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')] mix-blend-overlay" />
              
              <div className="w-px h-16 bg-gradient-to-b from-transparent to-[#C9A45C] mb-12" />
              
              {/* Couple Name in Closing (Groom Priority) */}
              <h2 className="font-accent text-6xl md:text-7xl text-[#C9A45C] leading-[1.1] z-10 relative">
                {config.priorityOrder === "bride" ? (
                  <>
                    {config.bride.name.split(" ")[0]}
                    <br/>
                    <span className="text-4xl">&amp;</span>
                    <br/>
                    {config.groom.name.split(" ")[0]}
                  </>
                ) : (
                  <>
                    {config.groom.name.split(" ")[0]}
                    <br/>
                    <span className="text-4xl">&amp;</span>
                    <br/>
                    {config.bride.name.split(" ")[0]}
                  </>
                )}
              </h2>

              <div className="w-px h-16 bg-gradient-to-t from-transparent to-[#C9A45C] mt-12 mb-8" />

              <p className="font-serif-premium text-[#F8E9E2] text-sm md:text-base italic z-10 tracking-wide">
                With love,<br/>
                {config.priorityOrder === "bride" 
                  ? `${config.bride.name.split(" ")[0]} & ${config.groom.name.split(" ")[0]}`
                  : `${config.groom.name.split(" ")[0]} & ${config.bride.name.split(" ")[0]}`}
              </p>
            </motion.section>
          </>
        )}

      </div>

      {/* 13. FLOATING BUTTONS */}
      {/* Floating "Edit Your Invitation" Button (Bottom Left) - can be hidden, only unhidden via Admin Panel */}
      {isOpened && showFloatingEditInvitation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-4 sm:left-6 z-40 flex items-center gap-1.5"
        >
          <button
            onClick={() => setShowEditModal(true)}
            className="group flex items-center gap-2 h-9 sm:h-10 px-3.5 py-1.5 rounded-full bg-[#641D2E]/95 hover:bg-[#85253C] text-white border border-[#dec47f]/70 shadow-[0_4px_16px_rgba(100,29,46,0.35)] hover:shadow-[0_6px_20px_rgba(100,29,46,0.5)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-md"
            title="Edit Your Invitation Details"
          >
            <div className="w-5 h-5 rounded-full bg-[#dec47f]/25 border border-[#dec47f]/60 flex items-center justify-center text-[#dec47f] shrink-0">
              <Pencil size={11} className="stroke-[2.5]" />
            </div>
            <span className="font-sans font-semibold text-xs tracking-wide text-[#F8E9E2]">
              Edit Your Invitation
            </span>
          </button>
          {/* Quick Hide Button right on the pill */}
          <button
            onClick={() => {
              setShowFloatingEditInvitation(false);
              try {
                localStorage.setItem("show_floating_edit_invitation", "false");
              } catch (e) {
                console.warn(e);
              }
            }}
            className="w-7 h-7 rounded-full bg-[#641D2E] hover:bg-[#85253C] text-[#dec47f] border border-[#dec47f]/50 flex items-center justify-center text-xs shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all"
            title="Hide floating edit invitation button"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Music Floating Toggle (Bottom Right) */}
      {isOpened && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 group">
          <div className="relative">
            <button
              onClick={toggleMusic}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-[0_4px_15px_rgb(0,0,0,0.15)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 border border-[#C9A45C]/50 ${
                musicPlaying ? "bg-[#B94E2F] text-white animate-[pulse_2s_ease-in-out_infinite]" : "bg-[#FFF9F3] text-[#B94E2F]"
              }`}
              title={musicPlaying ? "Mute Background Music" : "Play Background Music"}
            >
              {musicPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Scroll-to-Top Toggle (Bottom Right above Music) */}
      <AnimatePresence>
        {isOpened && showScrollTop && (
          <motion.div
            key="scroll-top"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-40 group"
          >
            <div className="relative">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-12 h-12 rounded-full bg-[#FFF9F3] text-[#B94E2F] font-bold flex items-center justify-center shadow-md border border-[#C9A45C]/50 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                title="Scroll To Top"
              >
                <ChevronUp size={20} className="stroke-[3]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Your Invitation Modal & WhatsApp Redirection */}
      <EditInvitationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        config={config}
        onPauseMusic={pauseMusic}
        onSaveConfig={handleConfigChange}
      />

      {/* RSVP Confirmation Modal */}
      <RSVPModal
        isOpen={showRsvpModal}
        onClose={handleModalClose}
        guestName={rsvpName}
        isAttending={rsvpAttend === true}
        guestsCount={rsvpGuests}
        weddingDate={config.weddingDate}
      />

      {/* End of Website Buttons: Only visible at the very end after cards are scratched, no other text */}
      {isOpened && allHeartsScratched && (
        <div className="w-full text-center pb-12 pt-6 relative z-10 flex flex-col items-center justify-center">
          {!showEditLogin && !showAdminLogin ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Edit Panel Button (Password: 2580) */}
              <button 
                onClick={() => {
                  setAdminMode("edit");
                  setAdminInitialTab("couple");
                  setAdminPanelTitle("Edit Panel");
                  setShowEditLogin(true);
                  setShowAdminLogin(false);
                  setEditLoginError(false);
                  setEditPwd("");
                }} 
                className="group inline-flex items-center gap-2 bg-[#641D2E] hover:bg-[#7d243a] text-[#dec47f] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg border border-[#dec47f]/40 hover:scale-105 active:scale-95 cursor-pointer"
                title="Open Edit Panel"
              >
                <Settings size={14} className="text-[#dec47f] group-hover:rotate-45 transition-transform" />
                <span>edit panel</span>
              </button>

              {/* Admin Panel Button (Password: 6396) */}
              <button 
                onClick={() => {
                  setAdminMode("admin");
                  setAdminInitialTab("workspace");
                  setAdminPanelTitle("Admin Panel");
                  setShowAdminLogin(true);
                  setShowEditLogin(false);
                  setAdminLoginError(false);
                  setAdminPwd("");
                }} 
                className="group inline-flex items-center gap-2 bg-[#4A1522] hover:bg-[#641D2E] text-[#F8E9E2] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg border border-[#C9A45C]/40 hover:scale-105 active:scale-95 cursor-pointer"
                title="Open Admin Panel"
              >
                <ShieldCheck size={14} className="text-[#dec47f] group-hover:scale-110 transition-transform" />
                <span>admin panel</span>
              </button>
            </div>
          ) : showEditLogin ? (
            <div className="flex flex-col items-center gap-2.5 bg-[#FFF9F3] p-5 rounded-2xl border-2 border-[#C9A45C]/40 shadow-xl max-w-xs mx-auto">
              <p className="text-xs uppercase tracking-widest text-[#641D2E] font-bold flex items-center gap-1.5">
                <Lock size={13} className="text-[#B94E2F]" /> Edit Panel Password
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="password"
                  value={editPwd}
                  onChange={(e) => {
                    setEditPwd(e.target.value);
                    setEditLoginError(false);
                  }}
                  placeholder="Password (2580)"
                  className="px-3 py-1.5 text-xs rounded-lg border border-[#C9A45C]/50 focus:outline-none focus:border-[#B94E2F] text-center w-32 bg-white font-mono"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editPwd === "2580") {
                        setAdminMode("edit");
                        setAdminInitialTab("couple");
                        setAdminPanelTitle("Edit Panel");
                        setShowAdmin(true);
                        setShowEditLogin(false);
                        setEditPwd("");
                      } else {
                        setEditLoginError(true);
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (editPwd === "2580") {
                      setAdminMode("edit");
                      setAdminInitialTab("couple");
                      setAdminPanelTitle("Edit Panel");
                      setShowAdmin(true);
                      setShowEditLogin(false);
                      setEditPwd("");
                    } else {
                      setEditLoginError(true);
                    }
                  }}
                  className="bg-[#B94E2F] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#8F3B22] transition-colors cursor-pointer"
                >
                  Enter
                </button>
                <button 
                  onClick={() => {
                    setShowEditLogin(false);
                    setEditPwd("");
                    setEditLoginError(false);
                  }}
                  className="text-[#765E52] px-2 py-1.5 rounded-lg text-xs hover:text-black transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              {editLoginError && <p className="text-red-500 text-[10px] m-0 font-semibold">Incorrect password. Please enter 2580.</p>}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 bg-[#FFF9F3] p-5 rounded-2xl border-2 border-[#C9A45C]/40 shadow-xl max-w-xs mx-auto">
              <p className="text-xs uppercase tracking-widest text-[#641D2E] font-bold flex items-center gap-1.5">
                <Lock size={13} className="text-[#B94E2F]" /> Admin Panel Password
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="password"
                  value={adminPwd}
                  onChange={(e) => {
                    setAdminPwd(e.target.value);
                    setAdminLoginError(false);
                  }}
                  placeholder="Password (6396)"
                  className="px-3 py-1.5 text-xs rounded-lg border border-[#C9A45C]/50 focus:outline-none focus:border-[#B94E2F] text-center w-32 bg-white font-mono"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (adminPwd === "6396") {
                        setAdminMode("admin");
                        setAdminInitialTab("workspace");
                        setAdminPanelTitle("Admin Panel");
                        setShowAdmin(true);
                        setShowAdminLogin(false);
                        setAdminPwd("");
                      } else {
                        setAdminLoginError(true);
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (adminPwd === "6396") {
                      setAdminMode("admin");
                      setAdminInitialTab("workspace");
                      setAdminPanelTitle("Admin Panel");
                      setShowAdmin(true);
                      setShowAdminLogin(false);
                      setAdminPwd("");
                    } else {
                      setAdminLoginError(true);
                    }
                  }}
                  className="bg-[#B94E2F] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#8F3B22] transition-colors cursor-pointer"
                >
                  Enter
                </button>
                <button 
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminPwd("");
                    setAdminLoginError(false);
                  }}
                  className="text-[#765E52] px-2 py-1.5 rounded-lg text-xs hover:text-black transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              {adminLoginError && <p className="text-red-500 text-[10px] m-0 font-semibold">Incorrect password. Please enter 6396.</p>}
            </div>
          )}
        </div>
      )}

      {/* Edit Panel / Admin Dashboard Drawer/Modal */}
      <AdminPanel
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
        config={config}
        onConfigChange={handleConfigChange}
        mode={adminMode}
        initialTab={adminInitialTab}
        title={adminPanelTitle}
        isFloatingEditButtonVisible={showFloatingEditInvitation}
        onToggleFloatingEditButton={(visible) => {
          setShowFloatingEditInvitation(visible);
          try {
            localStorage.setItem("show_floating_edit_invitation", String(visible));
          } catch (e) {
            console.warn(e);
          }
        }}
      />

    </div>
  );
}
