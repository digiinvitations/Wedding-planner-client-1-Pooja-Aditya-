import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Send,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Plus,
  Trash2,
  ChevronDown,
  Sparkles,
  Music,
  Users,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Pencil,
  ShieldCheck,
  Save,
  Type,
  Building2,
  Shirt,
  Mail,
  Phone
} from "lucide-react";
import { WeddingConfig, TypographyConfig, defaultTypographyConfig } from "../weddingConfig";
import { TypographyManager } from "./TypographyManager";
import {
  getActiveWorkspace,
  setActiveWorkspace,
  sanitizeWorkspaceId,
  WORKSPACE_PRESETS,
} from "../lib/clientWorkspace";

interface CeremonyEvent {
  id: string;
  eventName: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  mapDirectionsUrl: string;
}

interface EditInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WeddingConfig;
  onPauseMusic?: () => void;
  onSaveConfig?: (newConfig: WeddingConfig) => Promise<void>;
}

export function getDayAndYear(dateStr: string): { day: string; year: string } {
  if (!dateStr) return { day: "", year: "" };
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      const d = new Date(parseInt(year, 10), month, dayNum);
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return {
        day: days[d.getDay()] || "",
        year: year,
      };
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return {
        day: days[d.getDay()] || "",
        year: d.getFullYear().toString(),
      };
    }
  } catch {
    // fallback
  }
  return { day: "", year: "" };
}

const CEREMONY_PRESETS = [
  "Bonfire",
  "Jurun Ceremony",
  "Haldi Ceremony",
  "Sangeet Ceremony",
  "Wedding Ceremony (Pheras)",
  "Cocktail Party",
  "Reception",
  "Ring Ceremony / Engagement"
];

const HELPER_CHIPS = [
  { label: "👗 Dress Code / Theme", snippet: "• Dress Code / Theme: " },
  { label: "🏷️ Wedding Hashtag", snippet: "• Wedding Hashtag: #" },
  { label: "📸 Photo Gallery Section", snippet: "• Please include a Photo Gallery section with high-res photos" },
  { label: "🎥 Live Streaming Link", snippet: "• Live Streaming YouTube/Zoom Link: " },
  { label: "💌 RSVP Form", snippet: "• Include RSVP Form with guest count collection" },
  { label: "⏳ Countdown Timer", snippet: "• Include live countdown timer to the wedding date" },
  { label: "🏨 Hotel & Stay Info", snippet: "• Accommodation / Hotel Details: " },
  { label: "🚗 Travel & Shuttle Info", snippet: "• Shuttle / Travel & Parking Instructions: " },
];

export function EditInvitationModal({
  isOpen,
  onClose,
  config,
  onPauseMusic,
  onSaveConfig,
}: EditInvitationModalProps) {
  // Client Workspace / Remix Partition state
  const [clientWorkspace, setClientWorkspace] = useState(
    config.clientWorkspace || getActiveWorkspace()
  );
  const [customWorkspaceName, setCustomWorkspaceName] = useState("");
  const [isSavingLocally, setIsSavingLocally] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const handleSelectWorkspace = (name: string) => {
    if (!name || !name.trim()) return;
    const clean = name.trim();
    setClientWorkspace(clean);
    setActiveWorkspace(clean);
  };

  // 1. Groom & Bride Details
  const [groomName, setGroomName] = useState(config.groom?.name || "Aditya Ramesh");
  const [groomFather, setGroomFather] = useState(config.groom?.fatherName || "Mr. T.V. Ramesh");
  const [groomMother, setGroomMother] = useState(config.groom?.motherName || "Mrs. Usha Ramesh");
  const [groomBio, setGroomBio] = useState(config.groom?.bio || "");

  const [brideName, setBrideName] = useState(config.bride?.name || "Pooja Devi");
  const [brideFather, setBrideFather] = useState(config.bride?.fatherName || "Mr. Babul Nath");
  const [brideMother, setBrideMother] = useState(config.bride?.motherName || "Mrs. Momi Devi");
  const [brideBio, setBrideBio] = useState(config.bride?.bio || "");

  // 2. Wedding Information
  const initialDate = config.weddingDate?.split("T")[0] || "2027-01-18";
  const [weddingDate, setWeddingDate] = useState(initialDate);
  const [weddingTime, setWeddingTime] = useState("05:00 PM onwards");
  const [weddingVenue, setWeddingVenue] = useState(config.weddingEvents?.[0]?.venueName || "");
  const [weddingAddress, setWeddingAddress] = useState(config.weddingEvents?.[0]?.venueAddress || "");
  const [weddingMapsUrl, setWeddingMapsUrl] = useState(config.weddingEvents?.[0]?.mapDirectionsUrl || "");
  const [hashtag, setHashtag] = useState(config.hashtag || "#AdityaWedsPooja");

  // 3. Wedding Ceremonies
  const [events, setEvents] = useState<CeremonyEvent[]>(() => {
    if (config.weddingEvents && config.weddingEvents.length > 0) {
      return config.weddingEvents.map((ev, idx) => ({
        id: `ev-${idx}-${Date.now()}`,
        eventName: ev.eventName || "Ceremony",
        date: ev.time?.split("T")[0] || initialDate,
        time: ev.time?.includes("T") ? ev.time.split("T")[1] : "05:00 PM",
        venueName: ev.venueName || "",
        venueAddress: ev.venueAddress || "",
        mapDirectionsUrl: ev.mapDirectionsUrl || "",
      }));
    }
    return [];
  });

  // 4. Family Details
  const [welcomingText, setWelcomingText] = useState(
    config.familyDetails?.welcomingText || "Warmly Welcomed By:"
  );
  const [familyMessage, setFamilyMessage] = useState(
    config.familyDetails?.message || "With the divine blessings of Lord Ganesha and our elders, we cordially invite you and your family to grace our Wedding Ceremony in Mahabaleshwar."
  );
  const [familyNamesStr, setFamilyNamesStr] = useState(
    config.familyDetails?.names?.join(", ") || "Ramesh Family, Nath Family, All Relatives and Friends"
  );
  const [showFamilyDetails, setShowFamilyDetails] = useState<boolean>(config.showFamilyDetails ?? true);

  // 5. Hotel & Stay Details
  const [hotelEnabled, setHotelEnabled] = useState(config.hotelStay?.enabled ?? true);
  const [hotelName, setHotelName] = useState(config.hotelStay?.hotelName || "Mahableshwar");
  const [hotelTagline, setHotelTagline] = useState(config.hotelStay?.tagline || "Your Mountain Haven in the Panchgani-Mahabaleshwar Valleys");
  const [hotelCheckIn, setHotelCheckIn] = useState(config.hotelStay?.checkIn || "16th January 2027 • 12:00 PM");
  const [hotelCheckOut, setHotelCheckOut] = useState(config.hotelStay?.checkOut || "19th January 2027 • 11:00 AM");
  const [hotelAddress, setHotelAddress] = useState(config.hotelStay?.address || "");
  const [hotelRoomDetails, setHotelRoomDetails] = useState(config.hotelStay?.roomDetails || "Complimentary luxury accommodations have been arranged for all our guests. Enjoy mountain views, morning mist, and warm hospitality.");
  const [hotelTravelGuide, setHotelTravelGuide] = useState(config.hotelStay?.travelGuide || "Located on the main Panchgani-Mahabaleshwar highway. Pune Airport/Station is ~2.5 hrs drive; Mumbai is ~4.5 hrs drive via the Expressway.");
  const [hotelContact1Name, setHotelContact1Name] = useState(config.hotelStay?.assistanceContacts?.[0]?.name || "Mr. Vishal V");
  const [hotelContact1Phone, setHotelContact1Phone] = useState(config.hotelStay?.assistanceContacts?.[0]?.phone || "+91 7400052735");
  const [hotelContact2Name, setHotelContact2Name] = useState(config.hotelStay?.assistanceContacts?.[1]?.name || "Ms. Priti K");
  const [hotelContact2Phone, setHotelContact2Phone] = useState(config.hotelStay?.assistanceContacts?.[1]?.phone || "+91 7208782729");

  // 6. Dress Code Details
  const [dressCodeEnabled, setDressCodeEnabled] = useState(config.dressCode?.enabled ?? true);
  const [dressThemeTitle, setDressThemeTitle] = useState(config.dressCode?.themeTitle || "Kerala & Assamese Fusion Royalty");
  const [dressThemeSubtitle, setDressThemeSubtitle] = useState(config.dressCode?.themeSubtitle || "Traditional Splendor with Royal Gold & Pastel Tones");
  const [dressDescription, setDressDescription] = useState(config.dressCode?.description || "We warmly invite you to celebrate our union by donning Indian ethnic attire celebrating the cultural splendor of Kerala and Assam.");
  const [attireMen, setAttireMen] = useState(config.dressCode?.attireMen || "Traditional Kerala Mundu with Gold Zari / Kurta Pajama / Bandhgala / Nehru Jacket in pastel or ivory shades.");
  const [attireWomen, setAttireWomen] = useState(config.dressCode?.attireWomen || "Traditional Kasavu Saree / Assamese Mekhela Chador / Silk Saree / Lehenga in royal gold, rose, or pastel hues.");
  const [dressNote, setDressNote] = useState(config.dressCode?.note || "Comfortable footwear is recommended for the mountain resort lawns and garden pavilions.");

  // 7. RSVP Details
  const [rsvpEnabled, setRsvpEnabled] = useState(config.rsvpSection?.enabled ?? true);
  const [rsvpTitle, setRsvpTitle] = useState(config.rsvpSection?.title || "Kindly RSVP");
  const [rsvpSubtitle, setRsvpSubtitle] = useState(config.rsvpSection?.subtitle || "Your presence and blessings will make our celebration truly complete");
  const [rsvpDeadline, setRsvpDeadline] = useState(config.rsvpSection?.deadlineText || "Please confirm your attendance by 10th January 2027");
  const [rsvpContactName, setRsvpContactName] = useState(config.rsvpSection?.contactName || "Mr. Vishal V & Ms. Priti K");
  const [rsvpContactPhone, setRsvpContactPhone] = useState(config.rsvpSection?.contactPhone || "+91 7400052735");

  // 8. Invitation Message & Media
  const [invitationMessage, setInvitationMessage] = useState(
    config.heroSettings?.introText ||
      "With the divine blessings of Lord Ganesha and our cherished families, we joyfully invite you to celebrate the wedding ceremony of"
  );
  const [musicLink, setMusicLink] = useState(config.musicUrl || "");
  const [specificDetails, setSpecificDetails] = useState("");
  const [showEventAddressAndMap, setShowEventAddressAndMap] = useState<boolean>(config.showEventAddressAndMap ?? false);
  const [typography, setTypography] = useState<TypographyConfig>(config.typography || defaultTypographyConfig);

  // Synchronize state when config or isOpen changes
  useEffect(() => {
    if (!config) return;
    setClientWorkspace(config.clientWorkspace || getActiveWorkspace());
    setGroomName(config.groom?.name || "Aditya Ramesh");
    setGroomFather(config.groom?.fatherName || "Mr. T.V. Ramesh");
    setGroomMother(config.groom?.motherName || "Mrs. Usha Ramesh");
    setGroomBio(config.groom?.bio || "");

    setBrideName(config.bride?.name || "Pooja Devi");
    setBrideFather(config.bride?.fatherName || "Mr. Babul Nath");
    setBrideMother(config.bride?.motherName || "Mrs. Momi Devi");
    setBrideBio(config.bride?.bio || "");

    const cDate = config.weddingDate?.split("T")[0] || "2027-01-18";
    setWeddingDate(cDate);
    setWeddingVenue(config.weddingEvents?.[0]?.venueName || "");
    setWeddingAddress(config.weddingEvents?.[0]?.venueAddress || "");
    setWeddingMapsUrl(config.weddingEvents?.[0]?.mapDirectionsUrl || "");
    setHashtag(config.hashtag || "#AdityaWedsPooja");

    if (config.weddingEvents && config.weddingEvents.length > 0) {
      setEvents(
        config.weddingEvents.map((ev, idx) => ({
          id: `ev-${idx}-${Date.now()}`,
          eventName: ev.eventName || "Ceremony",
          date: ev.time?.split("T")[0] || cDate,
          time: ev.time?.includes("T") ? ev.time.split("T")[1] : "05:00 PM",
          venueName: ev.venueName || "",
          venueAddress: ev.venueAddress || "",
          mapDirectionsUrl: ev.mapDirectionsUrl || "",
        }))
      );
    }

    setWelcomingText(config.familyDetails?.welcomingText || "Warmly Welcomed By:");
    setFamilyMessage(config.familyDetails?.message || "With the divine blessings of Lord Ganesha and our elders, we cordially invite you and your family to grace our Wedding Ceremony in Mahabaleshwar.");
    setFamilyNamesStr(config.familyDetails?.names?.join(", ") || "Ramesh Family, Nath Family, All Relatives and Friends");
    setShowFamilyDetails(config.showFamilyDetails ?? true);

    setHotelEnabled(config.hotelStay?.enabled ?? true);
    setHotelName(config.hotelStay?.hotelName || "Mahableshwar");
    setHotelTagline(config.hotelStay?.tagline || "Your Mountain Haven in the Panchgani-Mahabaleshwar Valleys");
    setHotelCheckIn(config.hotelStay?.checkIn || "16th January 2027 • 12:00 PM");
    setHotelCheckOut(config.hotelStay?.checkOut || "19th January 2027 • 11:00 AM");
    setHotelAddress(config.hotelStay?.address || "");
    setHotelRoomDetails(config.hotelStay?.roomDetails || "Complimentary luxury accommodations have been arranged for all our guests. Enjoy mountain views, morning mist, and warm hospitality.");
    setHotelTravelGuide(config.hotelStay?.travelGuide || "Located on the main Panchgani-Mahabaleshwar highway. Pune Airport/Station is ~2.5 hrs drive; Mumbai is ~4.5 hrs drive via the Expressway.");
    setHotelContact1Name(config.hotelStay?.assistanceContacts?.[0]?.name || "Mr. Vishal V");
    setHotelContact1Phone(config.hotelStay?.assistanceContacts?.[0]?.phone || "+91 7400052735");
    setHotelContact2Name(config.hotelStay?.assistanceContacts?.[1]?.name || "Ms. Priti K");
    setHotelContact2Phone(config.hotelStay?.assistanceContacts?.[1]?.phone || "+91 7208782729");

    setDressCodeEnabled(config.dressCode?.enabled ?? true);
    setDressThemeTitle(config.dressCode?.themeTitle || "Kerala & Assamese Fusion Royalty");
    setDressThemeSubtitle(config.dressCode?.themeSubtitle || "Traditional Splendor with Royal Gold & Pastel Tones");
    setDressDescription(config.dressCode?.description || "We warmly invite you to celebrate our union by donning Indian ethnic attire celebrating the cultural splendor of Kerala and Assam.");
    setAttireMen(config.dressCode?.attireMen || "Traditional Kerala Mundu with Gold Zari / Kurta Pajama / Bandhgala / Nehru Jacket in pastel or ivory shades.");
    setAttireWomen(config.dressCode?.attireWomen || "Traditional Kasavu Saree / Assamese Mekhela Chador / Silk Saree / Lehenga in royal gold, rose, or pastel hues.");
    setDressNote(config.dressCode?.note || "Comfortable footwear is recommended for the mountain resort lawns and garden pavilions.");

    setRsvpEnabled(config.rsvpSection?.enabled ?? true);
    setRsvpTitle(config.rsvpSection?.title || "Kindly RSVP");
    setRsvpSubtitle(config.rsvpSection?.subtitle || "Your presence and blessings will make our celebration truly complete");
    setRsvpDeadline(config.rsvpSection?.deadlineText || "Please confirm your attendance by 10th January 2027");
    setRsvpContactName(config.rsvpSection?.contactName || "Mr. Vishal V & Ms. Priti K");
    setRsvpContactPhone(config.rsvpSection?.contactPhone || "+91 7400052735");

    setInvitationMessage(config.heroSettings?.introText || "With the divine blessings of Lord Ganesha and our cherished families, we joyfully invite you to celebrate the wedding ceremony of");
    setMusicLink(config.musicUrl || "");
    setShowEventAddressAndMap(config.showEventAddressAndMap ?? false);
    setTypography(config.typography || defaultTypographyConfig);
  }, [config, isOpen]);

  // Accordion state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    workspace: false,
    couple: true,
    weddingInfo: true,
    ceremonies: true,
    family: true,
    hotel: true,
    dressCode: true,
    rsvp: false,
    message: false,
    music: false,
    specialRequests: false,
    typography: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedNotification, setCopiedNotification] = useState(false);

  const { day: weddingDay, year: weddingYear } = getDayAndYear(weddingDate);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddPresetCeremony = (presetName: string) => {
    setEvents((prev) => [
      ...prev,
      {
        id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        eventName: presetName,
        date: weddingDate || initialDate,
        time: "06:00 PM",
        venueName: weddingVenue || "",
        venueAddress: weddingAddress || "",
        mapDirectionsUrl: "",
      },
    ]);
  };

  const handleRemoveCeremony = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleUpdateCeremony = (id: string, field: keyof CeremonyEvent, value: string) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, [field]: value } : ev))
    );
  };

  const handleChipClick = (snippet: string) => {
    setSpecificDetails((prev) => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return snippet;
      if (cleanPrev.includes(snippet.trim())) return prev;
      return `${cleanPrev}\n${snippet}`;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!groomName.trim()) newErrors.groomName = "Groom's name is required";
    if (!brideName.trim()) newErrors.brideName = "Bride's name is required";
    if (!weddingDate) newErrors.weddingDate = "Wedding date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Direct save to website & cloud database partition
  const handleSaveToWebsite = async () => {
    if (!validateForm()) {
      setExpandedSections((prev) => ({
        ...prev,
        couple: true,
        weddingInfo: true,
      }));
      return;
    }

    setIsSavingLocally(true);
    try {
      const updatedEvents = events.map((ev) => ({
        eventName: ev.eventName,
        time: `${ev.date}T${ev.time || "18:00:00"}`,
        venueName: ev.venueName,
        venueAddress: ev.venueAddress,
        mapEmbedUrl: ev.mapDirectionsUrl || config.weddingEvents?.[0]?.mapEmbedUrl || "",
        mapDirectionsUrl: ev.mapDirectionsUrl || config.weddingEvents?.[0]?.mapDirectionsUrl || "",
      }));

      const parsedFamilyNames = familyNamesStr
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const updatedConfig: WeddingConfig = {
        ...config,
        clientWorkspace: clientWorkspace,
        groom: {
          ...config.groom,
          name: groomName.trim(),
          fatherName: groomFather.trim(),
          motherName: groomMother.trim(),
          bio: groomBio.trim(),
          introLineage: `Son of ${groomFather.trim() || "Mr. T.V. Ramesh"} & ${groomMother.trim() || "Mrs. Usha Ramesh"}`,
        },
        bride: {
          ...config.bride,
          name: brideName.trim(),
          fatherName: brideFather.trim(),
          motherName: brideMother.trim(),
          bio: brideBio.trim(),
          introLineage: `Daughter of ${brideFather.trim() || "Mr. Babul Nath"} & ${brideMother.trim() || "Mrs. Momi Devi"}`,
        },
        weddingDate: weddingDate,
        displayDate: `${weddingDay ? weddingDay + ", " : ""}${weddingDate}`,
        hashtag: hashtag.trim() || "#AdityaWedsPooja",
        heroSettings: {
          ...config.heroSettings,
          groomParents: `Son of ${groomFather.trim() || "Mr. T.V. Ramesh"} & ${groomMother.trim() || "Mrs. Usha Ramesh"}`,
          brideParents: `Daughter of ${brideFather.trim() || "Mr. Babul Nath"} & ${brideMother.trim() || "Mrs. Momi Devi"}`,
          introText: invitationMessage.trim() || config.heroSettings?.introText,
        },
        musicUrl: musicLink.trim() || config.musicUrl,
        showEventAddressAndMap: showEventAddressAndMap,
        weddingEvents: updatedEvents.length > 0 ? updatedEvents : config.weddingEvents,
        familyDetails: {
          ...config.familyDetails,
          welcomingText: welcomingText.trim() || "Warmly Welcomed By:",
          message: familyMessage.trim() || "With the divine blessings of Lord Ganesha and our elders, we cordially invite you and your family to grace our Wedding Ceremony in Mahabaleshwar.",
          names: parsedFamilyNames.length > 0 ? parsedFamilyNames : config.familyDetails?.names || ["Ramesh Family", "Nath Family", "All Relatives and Friends"],
        },
        hotelStay: {
          ...config.hotelStay,
          enabled: hotelEnabled,
          hotelName: hotelName.trim(),
          tagline: hotelTagline.trim(),
          checkIn: hotelCheckIn.trim(),
          checkOut: hotelCheckOut.trim(),
          address: hotelAddress.trim(),
          roomDetails: hotelRoomDetails.trim(),
          travelGuide: hotelTravelGuide.trim(),
          assistanceContacts: [
            { name: hotelContact1Name.trim(), phone: hotelContact1Phone.trim() },
            { name: hotelContact2Name.trim(), phone: hotelContact2Phone.trim() }
          ],
        },
        dressCode: {
          ...config.dressCode,
          enabled: dressCodeEnabled,
          themeTitle: dressThemeTitle.trim(),
          themeSubtitle: dressThemeSubtitle.trim(),
          description: dressDescription.trim(),
          attireMen: attireMen.trim(),
          attireWomen: attireWomen.trim(),
          note: dressNote.trim(),
        },
        rsvpSection: {
          ...config.rsvpSection,
          enabled: rsvpEnabled,
          title: rsvpTitle.trim(),
          subtitle: rsvpSubtitle.trim(),
          deadlineText: rsvpDeadline.trim(),
          contactName: rsvpContactName.trim(),
          contactPhone: rsvpContactPhone.trim(),
        },
        showFamilyDetails: showFamilyDetails,
        typography: typography,
      };

      if (onSaveConfig) {
        await onSaveConfig(updatedConfig);
      }
      setSaveSuccessMsg(`All changes saved successfully!`);
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to save config:", err);
      setSaveSuccessMsg(`Changes saved to local storage!`);
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } finally {
      setIsSavingLocally(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!validateForm()) {
      setExpandedSections((prev) => ({
        ...prev,
        couple: true,
        weddingInfo: true,
      }));
      return;
    }

    if (onPauseMusic) {
      onPauseMusic();
    }

    let clientShareUrl = window.location.href;
    try {
      const urlObj = new URL(window.location.href);
      urlObj.searchParams.set("client", clientWorkspace);
      clientShareUrl = urlObj.toString();
    } catch {
      // fallback
    }

    // Build the formatted WhatsApp message
    let msg = `💍 *WEDDING INVITATION CUSTOMIZATION DETAILS*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `🏷️ *Client / Workspace:*\n${clientWorkspace}\n`;
    msg += `🌐 *URL:*\n${clientShareUrl}\n\n`;

    msg += `👰 *BRIDE DETAILS*\n`;
    msg += `• Name: ${brideName.trim()}\n`;
    if (brideFather.trim()) msg += `• Father: ${brideFather.trim()}\n`;
    if (brideMother.trim()) msg += `• Mother: ${brideMother.trim()}\n`;
    if (brideBio.trim()) msg += `• Intro: ${brideBio.trim()}\n`;
    msg += `\n`;

    msg += `🤵 *GROOM DETAILS*\n`;
    msg += `• Name: ${groomName.trim()}\n`;
    if (groomFather.trim()) msg += `• Father: ${groomFather.trim()}\n`;
    if (groomMother.trim()) msg += `• Mother: ${groomMother.trim()}\n`;
    if (groomBio.trim()) msg += `• Intro: ${groomBio.trim()}\n`;
    msg += `\n`;

    msg += `📅 *WEDDING CELEBRATION*\n`;
    msg += `• Date: ${weddingDate} (${weddingDay || "Day"}, ${weddingYear || "Year"})\n`;
    if (weddingTime.trim()) msg += `• Time: ${weddingTime.trim()}\n`;
    if (weddingVenue.trim()) msg += `• Venue: ${weddingVenue.trim()}\n`;
    if (weddingAddress.trim()) msg += `• Address: ${weddingAddress.trim()}\n`;
    if (hashtag.trim()) msg += `• Hashtag: ${hashtag.trim()}\n`;
    msg += `\n`;

    if (events.length > 0) {
      msg += `🎪 *CEREMONIES & EVENTS*\n`;
      events.forEach((ev, i) => {
        msg += `${i + 1}. *${ev.eventName}*\n`;
        if (ev.date) msg += `   • Date: ${ev.date}\n`;
        if (ev.time) msg += `   • Time: ${ev.time}\n`;
        if (ev.venueName) msg += `   • Venue: ${ev.venueName}\n`;
        if (ev.venueAddress) msg += `   • Address: ${ev.venueAddress}\n`;
      });
      msg += `\n`;
    }

    if (familyNamesStr.trim()) {
      msg += `👨‍👩‍👧‍👦 *FAMILY DETAILS*\n`;
      msg += `• Welcomed By: ${welcomingText.trim()}\n`;
      msg += `• Family: ${familyNamesStr.trim()}\n\n`;
    }

    if (hotelEnabled && hotelName.trim()) {
      msg += `🏨 *HOTEL & STAY*\n`;
      msg += `• Hotel: ${hotelName.trim()}\n`;
      msg += `• Check-In: ${hotelCheckIn}\n`;
      msg += `• Check-Out: ${hotelCheckOut}\n\n`;
    }

    if (dressCodeEnabled && dressThemeTitle.trim()) {
      msg += `👗 *DRESS CODE*\n`;
      msg += `• Theme: ${dressThemeTitle.trim()}\n`;
      if (attireMen.trim()) msg += `• Men: ${attireMen.trim()}\n`;
      if (attireWomen.trim()) msg += `• Women: ${attireWomen.trim()}\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Sent via Wedding E-Card Portal_`;

    const targetPhone = "919456411569";
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");

    try {
      navigator.clipboard?.writeText(msg);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 4000);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative z-10 w-full max-w-2xl bg-[#FFF9F3] border border-[#C9A45C]/50 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh] my-auto text-[#4B3A35] font-serif-premium"
        >
          {/* Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-[#641D2E] via-[#85253C] to-[#641D2E] text-white shrink-0 flex items-center justify-between border-b border-[#C9A45C]/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#dec47f]/20 border border-[#dec47f]/50 flex items-center justify-center text-[#dec47f] shadow-inner">
                <Pencil size={18} />
              </div>
              <div>
                <h2 className="font-accent text-2xl sm:text-3xl text-[#dec47f] leading-none tracking-wide">
                  Edit Invitation Details
                </h2>
                <p className="font-sans text-[11px] text-[#dec47f]/80 tracking-wider uppercase mt-1">
                  Customize personal, family, ceremonies, hotel &amp; dress code details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#dec47f] hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-5 bg-[#FFF9F3]">
            {copiedNotification && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Details copied! Opening WhatsApp...</span>
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2">
                <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold font-sans">Please fill in the required fields:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                    {Object.values(errors).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {saveSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* SECTION 1: COUPLE & PARENTS DETAILS */}
            <div className="bg-white/80 rounded-2xl border border-[#C9A45C]/30 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("couple")}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gradient-to-r from-[#dec47f]/10 to-transparent hover:bg-[#dec47f]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Heart size={18} className="text-[#B94E2F]" />
                  <span className="font-sans font-bold text-sm tracking-wide text-[#641D2E] uppercase">
                    1. Bride &amp; Groom Personal Details
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.couple ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.couple && (
                <div className="p-5 space-y-6 border-t border-[#C9A45C]/20 bg-white/40">
                  {/* Groom Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-[#C9A45C]/30 pb-1.5">
                      <span className="text-base">🤵</span>
                      <span className="font-sans text-xs uppercase font-bold text-[#641D2E] tracking-wider">
                        Groom Details
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Groom Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={groomName}
                        onChange={(e) => {
                          setGroomName(e.target.value);
                          if (errors.groomName) setErrors((prev) => ({ ...prev, groomName: "" }));
                        }}
                        placeholder="e.g. Aditya Ramesh"
                        className={`w-full px-3.5 py-2 text-sm bg-white border ${
                          errors.groomName ? "border-red-400" : "border-[#C9A45C]/40"
                        } rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all`}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                          Father's Name
                        </label>
                        <input
                          type="text"
                          value={groomFather}
                          onChange={(e) => setGroomFather(e.target.value)}
                          placeholder="e.g. Mr. T.V. Ramesh"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                          Mother's Name
                        </label>
                        <input
                          type="text"
                          value={groomMother}
                          onChange={(e) => setGroomMother(e.target.value)}
                          placeholder="e.g. Mrs. Usha Ramesh"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Groom Short Bio / Introduction
                      </label>
                      <textarea
                        rows={2}
                        value={groomBio}
                        onChange={(e) => setGroomBio(e.target.value)}
                        placeholder="e.g. Bringing the warmth and rich heritage of Kerala..."
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Bride Section */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 border-b border-[#C9A45C]/30 pb-1.5">
                      <span className="text-base">👰</span>
                      <span className="font-sans text-xs uppercase font-bold text-[#641D2E] tracking-wider">
                        Bride Details
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Bride Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={brideName}
                        onChange={(e) => {
                          setBrideName(e.target.value);
                          if (errors.brideName) setErrors((prev) => ({ ...prev, brideName: "" }));
                        }}
                        placeholder="e.g. Pooja Devi"
                        className={`w-full px-3.5 py-2 text-sm bg-white border ${
                          errors.brideName ? "border-red-400" : "border-[#C9A45C]/40"
                        } rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all`}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                          Father's Name
                        </label>
                        <input
                          type="text"
                          value={brideFather}
                          onChange={(e) => setBrideFather(e.target.value)}
                          placeholder="e.g. Mr. Babul Nath"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                          Mother's Name
                        </label>
                        <input
                          type="text"
                          value={brideMother}
                          onChange={(e) => setBrideMother(e.target.value)}
                          placeholder="e.g. Mrs. Momi Devi"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Bride Short Bio / Introduction
                      </label>
                      <textarea
                        rows={2}
                        value={brideBio}
                        onChange={(e) => setBrideBio(e.target.value)}
                        placeholder="e.g. Bringing the grace and enchanting charm of Assam..."
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: MAIN WEDDING INFO & DATE */}
            <div className="bg-white/80 rounded-2xl border border-[#C9A45C]/30 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("weddingInfo")}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gradient-to-r from-[#dec47f]/10 to-transparent hover:bg-[#dec47f]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar size={18} className="text-[#B94E2F]" />
                  <span className="font-sans font-bold text-sm tracking-wide text-[#641D2E] uppercase">
                    2. Wedding Date &amp; Information
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.weddingInfo ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.weddingInfo && (
                <div className="p-5 space-y-4 border-t border-[#C9A45C]/20 bg-white/40">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Wedding Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={weddingDate}
                        onChange={(e) => {
                          setWeddingDate(e.target.value);
                          if (errors.weddingDate) setErrors((prev) => ({ ...prev, weddingDate: "" }));
                        }}
                        className={`w-full px-3.5 py-2 text-sm bg-white border ${
                          errors.weddingDate ? "border-red-400" : "border-[#C9A45C]/40"
                        } rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Wedding Day (Auto)
                      </label>
                      <div className="w-full px-3.5 py-2 text-sm bg-[#FFF8F3] border border-[#C9A45C]/30 rounded-xl text-[#B94E2F] font-semibold">
                        {weddingDay || "----"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Wedding Year (Auto)
                      </label>
                      <div className="w-full px-3.5 py-2 text-sm bg-[#FFF8F3] border border-[#C9A45C]/30 rounded-xl text-[#B94E2F] font-semibold">
                        {weddingYear || "----"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Wedding Time
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={weddingTime}
                          onChange={(e) => setWeddingTime(e.target.value)}
                          placeholder="e.g. 05:00 PM onwards"
                          className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                        />
                        <Clock size={15} className="absolute left-3 top-2.5 text-[#C9A45C]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Wedding Hashtag
                      </label>
                      <input
                        type="text"
                        value={hashtag}
                        onChange={(e) => setHashtag(e.target.value)}
                        placeholder="e.g. #AdityaWedsPooja"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Main Venue Name
                      </label>
                      <input
                        type="text"
                        value={weddingVenue}
                        onChange={(e) => setWeddingVenue(e.target.value)}
                        placeholder="e.g. Mountain Breeze Resort"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Google Maps Link
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={weddingMapsUrl}
                          onChange={(e) => setWeddingMapsUrl(e.target.value)}
                          placeholder="https://maps.app.goo.gl/..."
                          className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                        />
                        <MapPin size={15} className="absolute left-3 top-2.5 text-[#C9A45C]" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                      Full Venue Address
                    </label>
                    <input
                      type="text"
                      value={weddingAddress}
                      onChange={(e) => setWeddingAddress(e.target.value)}
                      placeholder="e.g. Panchgani - Mahabaleshwar Road, Mahabaleshwar"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: WEDDING CEREMONIES */}
            <div className="bg-white/80 rounded-2xl border border-[#C9A45C]/30 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("ceremonies")}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gradient-to-r from-[#dec47f]/10 to-transparent hover:bg-[#dec47f]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className="text-[#B94E2F]" />
                  <span className="font-sans font-bold text-sm tracking-wide text-[#641D2E] uppercase">
                    3. Wedding Ceremonies &amp; Events ({events.length})
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.ceremonies ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.ceremonies && (
                <div className="p-5 space-y-4 border-t border-[#C9A45C]/20 bg-white/40">
                  {/* Event Address & Google Maps Visibility Toggle */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#C9A45C]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-xs font-bold text-[#641D2E] block">
                        Ceremonies Address &amp; Map Buttons on Website
                      </span>
                      <span className="text-[11px] text-[#765E52]">
                        Status: <strong className={showEventAddressAndMap ? "text-emerald-700 font-semibold" : "text-[#B94E2F] font-semibold"}>
                          {showEventAddressAndMap ? "Visible under cards" : "Hidden under cards"}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEventAddressAndMap((v) => !v)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        showEventAddressAndMap
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-[#641D2E] text-white border-[#641D2E] hover:bg-[#85253C]"
                      }`}
                    >
                      {showEventAddressAndMap ? "✓ Shown (Click to Hide)" : "Hidden (Click to Show)"}
                    </button>
                  </div>

                  {/* Add Preset Ceremony Buttons */}
                  <div>
                    <label className="block text-xs font-sans font-medium text-[#765E52] mb-1.5">
                      Quick Add Common Ceremonies:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CEREMONY_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleAddPresetCeremony(preset)}
                          className="px-2.5 py-1 text-xs bg-white border border-[#C9A45C]/40 text-[#641D2E] rounded-full hover:bg-[#dec47f]/20 hover:border-[#B94E2F] transition-all cursor-pointer font-sans shadow-xs flex items-center gap-1"
                        >
                          <Plus size={11} className="text-[#B94E2F]" />
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Events List */}
                  <div className="space-y-3 pt-2">
                    {events.map((ev, index) => {
                      const { day: evDay } = getDayAndYear(ev.date);
                      return (
                        <div
                          key={ev.id}
                          className="p-4 bg-white rounded-xl border border-[#C9A45C]/40 shadow-xs space-y-3 relative group"
                        >
                          <div className="flex items-center justify-between border-b border-[#C9A45C]/20 pb-2">
                            <span className="font-sans font-bold text-xs uppercase text-[#641D2E] tracking-wider flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#dec47f]/30 text-[#641D2E] text-[10px] flex items-center justify-center font-bold">
                                {index + 1}
                              </span>
                              {ev.eventName || `Ceremony ${index + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCeremony(ev.id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remove ceremony"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-sans font-medium text-[#765E52] mb-1">
                                Event Title
                              </label>
                              <input
                                type="text"
                                value={ev.eventName}
                                onChange={(e) =>
                                  handleUpdateCeremony(ev.id, "eventName", e.target.value)
                                }
                                placeholder="e.g. Sangeet Evening"
                                className="w-full px-3 py-1.5 text-xs bg-[#FFFDF9] border border-[#C9A45C]/40 rounded-lg focus:outline-none focus:border-[#B94E2F]"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-sans font-medium text-[#765E52] mb-1">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  value={ev.date}
                                  onChange={(e) =>
                                    handleUpdateCeremony(ev.id, "date", e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 text-xs bg-[#FFFDF9] border border-[#C9A45C]/40 rounded-lg focus:outline-none focus:border-[#B94E2F]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-sans font-medium text-[#765E52] mb-1">
                                  Day (Auto)
                                </label>
                                <div className="w-full px-2 py-1.5 text-xs bg-[#FFF8F3] border border-[#C9A45C]/30 rounded-lg text-[#B94E2F] font-semibold text-center truncate">
                                  {evDay || "Select date"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-sans font-medium text-[#765E52] mb-1">
                                Time
                              </label>
                              <input
                                type="text"
                                value={ev.time}
                                onChange={(e) =>
                                  handleUpdateCeremony(ev.id, "time", e.target.value)
                                }
                                placeholder="e.g. 05:00 PM"
                                className="w-full px-3 py-1.5 text-xs bg-[#FFFDF9] border border-[#C9A45C]/40 rounded-lg focus:outline-none focus:border-[#B94E2F]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-sans font-medium text-[#765E52] mb-1">
                                Venue Name
                              </label>
                              <input
                                type="text"
                                value={ev.venueName}
                                onChange={(e) =>
                                  handleUpdateCeremony(ev.id, "venueName", e.target.value)
                                }
                                placeholder="e.g. Mountain Breeze Lawn"
                                className="w-full px-3 py-1.5 text-xs bg-[#FFFDF9] border border-[#C9A45C]/40 rounded-lg focus:outline-none focus:border-[#B94E2F]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-sans font-medium text-[#765E52] mb-1">
                                Venue Address
                              </label>
                              <input
                                type="text"
                                value={ev.venueAddress}
                                onChange={(e) =>
                                  handleUpdateCeremony(ev.id, "venueAddress", e.target.value)
                                }
                                placeholder="e.g. Panchgani - Mahabaleshwar Road"
                                className="w-full px-3 py-1.5 text-xs bg-[#FFFDF9] border border-[#C9A45C]/40 rounded-lg focus:outline-none focus:border-[#B94E2F]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-sans font-medium text-[#765E52] mb-1">
                                Google Maps Link
                              </label>
                              <input
                                type="url"
                                value={ev.mapDirectionsUrl}
                                onChange={(e) =>
                                  handleUpdateCeremony(ev.id, "mapDirectionsUrl", e.target.value)
                                }
                                placeholder="https://maps.app.goo.gl/..."
                                className="w-full px-3 py-1.5 text-xs bg-[#FFFDF9] border border-[#C9A45C]/40 rounded-lg focus:outline-none focus:border-[#B94E2F]"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: FAMILY DETAILS */}
            <div className="bg-white/80 rounded-2xl border border-[#C9A45C]/30 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("family")}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gradient-to-r from-[#dec47f]/10 to-transparent hover:bg-[#dec47f]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Users size={18} className="text-[#B94E2F]" />
                  <span className="font-sans font-bold text-sm tracking-wide text-[#641D2E] uppercase">
                    4. Family Details &amp; Welcoming Message
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.family ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.family && (
                <div className="p-5 space-y-4 border-t border-[#C9A45C]/20 bg-white/40">
                  {/* Family Section Visibility Toggle */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#C9A45C]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-xs font-bold text-[#641D2E] block">
                        Family Details Section on Website
                      </span>
                      <span className="text-[11px] text-[#765E52]">
                        Status: <strong className={showFamilyDetails ? "text-emerald-700 font-semibold" : "text-[#B94E2F] font-semibold"}>
                          {showFamilyDetails ? "Visible on wedding website" : "Hidden from wedding website"}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFamilyDetails((v) => !v)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        showFamilyDetails
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-[#641D2E] text-white border-[#641D2E] hover:bg-[#85253C]"
                      }`}
                    >
                      {showFamilyDetails ? "✓ Visible (Click to Hide)" : "Hidden (Click to Show)"}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                      Welcoming Header Text
                    </label>
                    <input
                      type="text"
                      value={welcomingText}
                      onChange={(e) => setWelcomingText(e.target.value)}
                      placeholder="e.g. Warmly Welcomed By:"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                      Family Names (Comma separated or one per line)
                    </label>
                    <textarea
                      rows={2}
                      value={familyNamesStr}
                      onChange={(e) => setFamilyNamesStr(e.target.value)}
                      placeholder="e.g. Ramesh Family, Nath Family, All Relatives and Friends"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                      Family Cordial Invitation Message
                    </label>
                    <textarea
                      rows={3}
                      value={familyMessage}
                      onChange={(e) => setFamilyMessage(e.target.value)}
                      placeholder="e.g. With the divine blessings of Lord Ganesha and our elders, we cordially invite you..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: HOTEL & STAY DETAILS */}
            <div className="bg-white/80 rounded-2xl border border-[#C9A45C]/30 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("hotel")}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gradient-to-r from-[#dec47f]/10 to-transparent hover:bg-[#dec47f]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 size={18} className="text-[#B94E2F]" />
                  <span className="font-sans font-bold text-sm tracking-wide text-[#641D2E] uppercase">
                    5. Hotel &amp; Stay Accommodation
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.hotel ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.hotel && (
                <div className="p-5 space-y-4 border-t border-[#C9A45C]/20 bg-white/40">
                  <div className="bg-white p-3.5 rounded-xl border border-[#C9A45C]/40 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#641D2E] block">
                        Hotel &amp; Stay Section Visibility
                      </span>
                      <span className="text-[11px] text-[#765E52]">
                        {hotelEnabled ? "Visible on wedding website" : "Hidden from wedding website"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHotelEnabled(!hotelEnabled)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        hotelEnabled
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-gray-400 text-white border-gray-500"
                      }`}
                    >
                      {hotelEnabled ? "✓ Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Venue / Hotel Display Name
                      </label>
                      <input
                        type="text"
                        value={hotelName}
                        onChange={(e) => setHotelName(e.target.value)}
                        placeholder="e.g. Mahableshwar"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        value={hotelTagline}
                        onChange={(e) => setHotelTagline(e.target.value)}
                        placeholder="e.g. Your Mountain Haven in the Panchgani-Mahabaleshwar Valleys"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Check-In Info
                      </label>
                      <input
                        type="text"
                        value={hotelCheckIn}
                        onChange={(e) => setHotelCheckIn(e.target.value)}
                        placeholder="e.g. 16th January 2027 • 12:00 PM"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Check-Out Info
                      </label>
                      <input
                        type="text"
                        value={hotelCheckOut}
                        onChange={(e) => setHotelCheckOut(e.target.value)}
                        placeholder="e.g. 19th January 2027 • 11:00 AM"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                      Room &amp; Accommodation Details
                    </label>
                    <textarea
                      rows={2}
                      value={hotelRoomDetails}
                      onChange={(e) => setHotelRoomDetails(e.target.value)}
                      placeholder="e.g. Complimentary luxury accommodations have been arranged..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                      Travel &amp; Transit Info
                    </label>
                    <textarea
                      rows={2}
                      value={hotelTravelGuide}
                      onChange={(e) => setHotelTravelGuide(e.target.value)}
                      placeholder="e.g. Located on the main Panchgani-Mahabaleshwar highway..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                    />
                  </div>

                  <div className="border-t border-[#C9A45C]/30 pt-3">
                    <span className="block text-xs font-bold text-[#641D2E] mb-2">
                      Assistance Helpdesk Contacts:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-[#C9A45C]/30 space-y-2">
                        <span className="text-[11px] font-semibold text-[#B94E2F]">Contact 1</span>
                        <input
                          type="text"
                          value={hotelContact1Name}
                          onChange={(e) => setHotelContact1Name(e.target.value)}
                          placeholder="Name (e.g. Mr. Vishal V)"
                          className="w-full px-2.5 py-1.5 text-xs bg-[#FFFDF9] border border-[#C9A45C]/40 rounded-lg focus:outline-none"
                        />
                        <input
                          type="text"
                          value={hotelContact1Phone}
                          onChange={(e) => setHotelContact1Phone(e.target.value)}
                          placeholder="Phone (e.g. +91 7400052735)"
                          className="w-full px-2.5 py-1.5 text-xs bg-[#FFFDF9] border border-[#C9A45C]/40 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#C9A45C]/30 space-y-2">
                        <span className="text-[11px] font-semibold text-[#B94E2F]">Contact 2</span>
                        <input
                          type="text"
                          value={hotelContact2Name}
                          onChange={(e) => setHotelContact2Name(e.target.value)}
                          placeholder="Name (e.g. Ms. Priti K)"
                          className="w-full px-2.5 py-1.5 text-xs bg-[#FFFDF9] border border-[#C9A45C]/40 rounded-lg focus:outline-none"
                        />
                        <input
                          type="text"
                          value={hotelContact2Phone}
                          onChange={(e) => setHotelContact2Phone(e.target.value)}
                          placeholder="Phone (e.g. +91 7208782729)"
                          className="w-full px-2.5 py-1.5 text-xs bg-[#FFFDF9] border border-[#C9A45C]/40 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 6: DRESS CODE DETAILS */}
            <div className="bg-white/80 rounded-2xl border border-[#C9A45C]/30 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("dressCode")}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gradient-to-r from-[#dec47f]/10 to-transparent hover:bg-[#dec47f]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Shirt size={18} className="text-[#B94E2F]" />
                  <span className="font-sans font-bold text-sm tracking-wide text-[#641D2E] uppercase">
                    6. Dress Code &amp; Themes
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.dressCode ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.dressCode && (
                <div className="p-5 space-y-4 border-t border-[#C9A45C]/20 bg-white/40">
                  <div className="bg-white p-3.5 rounded-xl border border-[#C9A45C]/40 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#641D2E] block">
                        Dress Code Section Visibility
                      </span>
                      <span className="text-[11px] text-[#765E52]">
                        {dressCodeEnabled ? "Visible on wedding website" : "Hidden from wedding website"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDressCodeEnabled(!dressCodeEnabled)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        dressCodeEnabled
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-gray-400 text-white border-gray-500"
                      }`}
                    >
                      {dressCodeEnabled ? "✓ Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Theme Title
                      </label>
                      <input
                        type="text"
                        value={dressThemeTitle}
                        onChange={(e) => setDressThemeTitle(e.target.value)}
                        placeholder="e.g. Kerala & Assamese Fusion Royalty"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Theme Subtitle
                      </label>
                      <input
                        type="text"
                        value={dressThemeSubtitle}
                        onChange={(e) => setDressThemeSubtitle(e.target.value)}
                        placeholder="e.g. Traditional Splendor with Royal Gold & Pastel Tones"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                      Theme Description
                    </label>
                    <textarea
                      rows={2}
                      value={dressDescription}
                      onChange={(e) => setDressDescription(e.target.value)}
                      placeholder="e.g. We warmly invite you to celebrate our union by donning Indian ethnic attire..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Attire for Men
                      </label>
                      <textarea
                        rows={2}
                        value={attireMen}
                        onChange={(e) => setAttireMen(e.target.value)}
                        placeholder="e.g. Traditional Kerala Mundu with Gold Zari / Kurta Pajama..."
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Attire for Women
                      </label>
                      <textarea
                        rows={2}
                        value={attireWomen}
                        onChange={(e) => setAttireWomen(e.target.value)}
                        placeholder="e.g. Traditional Kasavu Saree / Assamese Mekhela Chador..."
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                      Footwear / General Note
                    </label>
                    <input
                      type="text"
                      value={dressNote}
                      onChange={(e) => setDressNote(e.target.value)}
                      placeholder="e.g. Comfortable footwear is recommended for mountain lawns..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 7: RSVP SECTION */}
            <div className="bg-white/80 rounded-2xl border border-[#C9A45C]/30 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("rsvp")}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gradient-to-r from-[#dec47f]/10 to-transparent hover:bg-[#dec47f]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Mail size={18} className="text-[#B94E2F]" />
                  <span className="font-sans font-bold text-sm tracking-wide text-[#641D2E] uppercase">
                    7. RSVP Details
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.rsvp ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.rsvp && (
                <div className="p-5 space-y-4 border-t border-[#C9A45C]/20 bg-white/40">
                  <div className="bg-white p-3.5 rounded-xl border border-[#C9A45C]/40 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#641D2E] block">
                        RSVP Section Visibility
                      </span>
                      <span className="text-[11px] text-[#765E52]">
                        {rsvpEnabled ? "Visible on wedding website" : "Hidden from wedding website"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRsvpEnabled(!rsvpEnabled)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        rsvpEnabled
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-gray-400 text-white border-gray-500"
                      }`}
                    >
                      {rsvpEnabled ? "✓ Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={rsvpTitle}
                        onChange={(e) => setRsvpTitle(e.target.value)}
                        placeholder="e.g. Kindly RSVP"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Deadline
                      </label>
                      <input
                        type="text"
                        value={rsvpDeadline}
                        onChange={(e) => setRsvpDeadline(e.target.value)}
                        placeholder="e.g. Please confirm attendance by 10th January 2027"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={rsvpSubtitle}
                      onChange={(e) => setRsvpSubtitle(e.target.value)}
                      placeholder="e.g. Your presence and blessings will make our celebration complete"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={rsvpContactName}
                        onChange={(e) => setRsvpContactName(e.target.value)}
                        placeholder="e.g. Mr. Vishal V & Ms. Priti K"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={rsvpContactPhone}
                        onChange={(e) => setRsvpContactPhone(e.target.value)}
                        placeholder="e.g. +91 7400052735"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 8: INVITATION MESSAGE */}
            <div className="bg-white/80 rounded-2xl border border-[#C9A45C]/30 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("message")}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gradient-to-r from-[#dec47f]/10 to-transparent hover:bg-[#dec47f]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={18} className="text-[#B94E2F]" />
                  <span className="font-sans font-bold text-sm tracking-wide text-[#641D2E] uppercase">
                    8. Hero Invocation &amp; Blessing Message
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.message ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.message && (
                <div className="p-5 space-y-3 border-t border-[#C9A45C]/20 bg-white/40">
                  <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                    Custom Invitation Invocation
                  </label>
                  <textarea
                    rows={3}
                    value={invitationMessage}
                    onChange={(e) => setInvitationMessage(e.target.value)}
                    placeholder="Enter your preferred invitation message or blessing..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                  />
                </div>
              )}
            </div>

            {/* SECTION 9: BACKGROUND MUSIC */}
            <div className="bg-white/80 rounded-2xl border border-[#C9A45C]/30 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("music")}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gradient-to-r from-[#dec47f]/10 to-transparent hover:bg-[#dec47f]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Music size={18} className="text-[#B94E2F]" />
                  <span className="font-sans font-bold text-sm tracking-wide text-[#641D2E] uppercase">
                    9. Background Music Link
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.music ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.music && (
                <div className="p-5 space-y-3 border-t border-[#C9A45C]/20 bg-white/40">
                  <label className="block text-xs font-sans font-medium text-[#765E52] mb-1">
                    Audio MP3 Direct Link
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={musicLink}
                      onChange={(e) => setMusicLink(e.target.value)}
                      placeholder="e.g. https://.../audio.mp3"
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#C9A45C]/40 rounded-xl focus:outline-none focus:border-[#B94E2F] transition-all"
                    />
                    <Music size={15} className="absolute left-3 top-2.5 text-[#C9A45C]" />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 10: FONT SIZES & TYPOGRAPHY */}
            <div className="bg-white/80 rounded-2xl border border-[#C9A45C]/30 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("typography")}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gradient-to-r from-[#dec47f]/10 to-transparent hover:bg-[#dec47f]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Type size={18} className="text-[#B94E2F]" />
                  <span className="font-sans font-bold text-sm tracking-wide text-[#641D2E] uppercase">
                    10. Font Sizes &amp; Typography
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.typography ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.typography && (
                <div className="p-5 border-t border-[#C9A45C]/20 bg-white/70">
                  <TypographyManager
                    typography={typography}
                    onChange={setTypography}
                  />
                </div>
              )}
            </div>

            {/* SECTION 11: CLIENT WORKSPACE & PARTITIONS */}
            <div className="bg-gradient-to-r from-[#FFF8EE] to-[#FFF3E0] rounded-2xl border-2 border-[#C9A45C]/60 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("workspace")}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-gradient-to-r from-[#C9A45C]/15 to-transparent hover:bg-[#C9A45C]/25 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={20} className="text-[#B94E2F]" />
                  <div>
                    <span className="font-sans font-bold text-xs sm:text-sm tracking-wide text-[#641D2E] uppercase flex items-center gap-2">
                      Client Workspace Partition
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dec47f]/40 text-[#641D2E] font-semibold">
                        {clientWorkspace}
                      </span>
                    </span>
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#B94E2F] transition-transform duration-200 ${
                    expandedSections.workspace ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.workspace && (
                <div className="p-4 sm:p-5 space-y-3.5 border-t border-[#C9A45C]/30 bg-white/60">
                  <div className="flex flex-wrap gap-2">
                    {WORKSPACE_PRESETS.slice(0, 6).map((preset) => {
                      const isSelected = clientWorkspace === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSelectWorkspace(preset)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all cursor-pointer ${
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
              )}
            </div>
          </div>

          {/* Footer with Save to Website & WhatsApp Redirection Button */}
          <div className="px-6 py-4 bg-white/95 border-t border-[#C9A45C]/30 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="text-center sm:text-left">
              <span className="text-xs text-[#765E52] block font-sans">
                Review &amp; send on WhatsApp:
              </span>
              <span className="text-xs font-bold text-[#B94E2F] font-sans">
                WhatsApp: +91 9456411569
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              {onSaveConfig && (
                <button
                  type="button"
                  onClick={handleSaveToWebsite}
                  disabled={isSavingLocally}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#C9A45C] to-[#dec47f] hover:from-[#B94E2F] hover:to-[#C9A45C] text-[#641D2E] hover:text-white rounded-full font-sans font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{isSavingLocally ? "Saving..." : "Save Changes"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full font-sans font-bold text-xs sm:text-sm tracking-wide shadow-[0_4px_16px_rgba(37,211,102,0.4)] flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                <Send size={15} />
                <span>Send Details on Whatsapp</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
