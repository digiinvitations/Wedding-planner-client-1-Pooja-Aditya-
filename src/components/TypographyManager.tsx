import React, { useState } from "react";
import {
  Type,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Shirt,
  Users,
  Heart,
  Calendar,
  Building2,
  MessageSquare,
  Crown,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { TypographyConfig, defaultTypographyConfig } from "../weddingConfig";

interface TypographyManagerProps {
  typography?: TypographyConfig;
  onChange: (newTypography: TypographyConfig) => void;
  initialSection?: string;
}

interface FontFieldConfig {
  key: string;
  label: string;
  desc?: string;
  min: number;
  max: number;
  defaultVal: number;
  sampleText: string;
}

interface SectionGroup {
  id: keyof Omit<TypographyConfig, "globalScale">;
  title: string;
  icon: React.ReactNode;
  badge?: string;
  fields: FontFieldConfig[];
}

export const TypographyManager: React.FC<TypographyManagerProps> = ({
  typography,
  onChange,
  initialSection = "dressCode"
}) => {
  const currentTypo: TypographyConfig = {
    globalScale: typography?.globalScale ?? defaultTypographyConfig.globalScale ?? 100,
    hero: { ...defaultTypographyConfig.hero, ...(typography?.hero || {}) },
    saveTheDate: { ...defaultTypographyConfig.saveTheDate, ...(typography?.saveTheDate || {}) },
    story: { ...defaultTypographyConfig.story, ...(typography?.story || {}) },
    events: { ...defaultTypographyConfig.events, ...(typography?.events || {}) },
    dressCode: { ...defaultTypographyConfig.dressCode, ...(typography?.dressCode || {}) },
    hotelStay: { ...defaultTypographyConfig.hotelStay, ...(typography?.hotelStay || {}) },
    rsvp: { ...defaultTypographyConfig.rsvp, ...(typography?.rsvp || {}) },
    familyDetails: { ...defaultTypographyConfig.familyDetails, ...(typography?.familyDetails || {}) },
    footer: { ...defaultTypographyConfig.footer, ...(typography?.footer || {}) },
  };

  const [activeAccordion, setActiveAccordion] = useState<string>(initialSection);

  const sections: SectionGroup[] = [
    {
      id: "dressCode",
      title: "Dress Code & Theme",
      icon: <Shirt size={18} className="text-[#B94E2F]" />,
      badge: "Requested",
      fields: [
        {
          key: "heading",
          label: "Section Main Heading",
          desc: "Main title: 'Dress Code'",
          min: 20,
          max: 64,
          defaultVal: defaultTypographyConfig.dressCode?.heading ?? 40,
          sampleText: "Dress Code",
        },
        {
          key: "subheading",
          label: "Theme & Category Tag",
          desc: "Top tag: 'STYLE & CELEBRATION'",
          min: 10,
          max: 24,
          defaultVal: defaultTypographyConfig.dressCode?.subheading ?? 14,
          sampleText: "STYLE & CELEBRATION",
        },
        {
          key: "ceremonyTitle",
          label: "Ceremony Card Titles",
          desc: "'On Juroon', 'On Shadi', 'On Reception'",
          min: 14,
          max: 36,
          defaultVal: defaultTypographyConfig.dressCode?.ceremonyTitle ?? 20,
          sampleText: "On Juroon / On Shadi",
        },
        {
          key: "instructions",
          label: "Instructions & Color Guidelines",
          desc: "'Avoid dark colour', 'Wear gold or pastel'",
          min: 12,
          max: 30,
          defaultVal: defaultTypographyConfig.dressCode?.instructions ?? 16,
          sampleText: "Wear gold or pastel • Avoid dark colour",
        },
      ],
    },
    {
      id: "familyDetails",
      title: "Family Details Section",
      icon: <Users size={18} className="text-[#641D2E]" />,
      badge: "Requested",
      fields: [
        {
          key: "heading",
          label: "Section Main Heading",
          desc: "Main title: 'Family Details'",
          min: 20,
          max: 64,
          defaultVal: defaultTypographyConfig.familyDetails?.heading ?? 40,
          sampleText: "Family Details",
        },
        {
          key: "quote",
          label: "Blessing Quote",
          desc: '"With heart full of love and immense joy"',
          min: 12,
          max: 32,
          defaultVal: defaultTypographyConfig.familyDetails?.quote ?? 19,
          sampleText: "“With heart full of love and immense joy”",
        },
        {
          key: "memberName",
          label: "Couple / Member Names",
          desc: "'Aditya Ramesh' & 'Pooja Devi'",
          min: 18,
          max: 48,
          defaultVal: defaultTypographyConfig.familyDetails?.memberName ?? 30,
          sampleText: "Aditya Ramesh • Pooja Devi",
        },
        {
          key: "parents",
          label: "Parents' Lineage",
          desc: "'S/O Mr T.V.Ramesh & Usha Ramesh'",
          min: 13,
          max: 32,
          defaultVal: defaultTypographyConfig.familyDetails?.parents ?? 19,
          sampleText: "S/O Mr T.V.Ramesh & Usha Ramesh",
        },
        {
          key: "relatives",
          label: "Siblings & Relatives List",
          desc: "Brother, sister, and extended family list",
          min: 12,
          max: 28,
          defaultVal: defaultTypographyConfig.familyDetails?.relatives ?? 16,
          sampleText: "Megha Ramesh (Sister) & Sekhar Kothanath",
        },
      ],
    },
    {
      id: "footer",
      title: "Footer & Closing Section",
      icon: <Heart size={18} className="text-[#B94E2F]" />,
      badge: "Requested",
      fields: [
        {
          key: "heading",
          label: "Celebration Heading",
          desc: "'Celebrate With Us'",
          min: 24,
          max: 72,
          defaultVal: defaultTypographyConfig.footer?.heading ?? 50,
          sampleText: "Celebrate With Us",
        },
        {
          key: "content",
          label: "Celebration Invitation Message",
          desc: "'At last, the stars align, two beautiful cultures intertwine...'",
          min: 12,
          max: 30,
          defaultVal: defaultTypographyConfig.footer?.content ?? 18,
          sampleText: "With hearts overflowing with gratitude, we warmly invite you...",
        },
        {
          key: "coupleNames",
          label: "Closing Couple Names",
          desc: "Large monogram names at bottom",
          min: 28,
          max: 84,
          defaultVal: defaultTypographyConfig.footer?.coupleNames ?? 60,
          sampleText: "Aditya & Pooja",
        },
        {
          key: "signature",
          label: "Sign-Off Signature",
          desc: "'With love, Aditya, Pooja & Family'",
          min: 12,
          max: 32,
          defaultVal: defaultTypographyConfig.footer?.signature ?? 19,
          sampleText: "With love, Aditya, Pooja & Family",
        },
      ],
    },
    {
      id: "hero",
      title: "Hero & Introduction",
      icon: <Crown size={18} className="text-[#C9A45C]" />,
      fields: [
        {
          key: "coupleNames",
          label: "Couple Names Heading",
          desc: "Main groom and bride names on opening hero",
          min: 24,
          max: 76,
          defaultVal: defaultTypographyConfig.hero?.coupleNames ?? 52,
          sampleText: "Aditya Ramesh & Pooja Devi",
        },
        {
          key: "parents",
          label: "Parents' Lineage (Father Priority)",
          desc: "'Son of Mr. T.V. Ramesh & Mrs. Usha Ramesh'",
          min: 12,
          max: 28,
          defaultVal: defaultTypographyConfig.hero?.parents ?? 18,
          sampleText: "Son of Mr. T.V. Ramesh & Mrs. Usha Ramesh",
        },
        {
          key: "shloka",
          label: "Sanskrit Shloka",
          desc: "Lord Ganesha blessing shloka",
          min: 12,
          max: 28,
          defaultVal: defaultTypographyConfig.hero?.shloka ?? 18,
          sampleText: "॥ श्री गणेशाय नमः ॥ वक्रतुण्ड महाकाय...",
        },
        {
          key: "intro",
          label: "Intro Invitation Text",
          desc: "'With the divine blessings of Lord Ganesha...'",
          min: 12,
          max: 28,
          defaultVal: defaultTypographyConfig.hero?.intro ?? 18,
          sampleText: "we joyfully invite you to celebrate the wedding ceremony of",
        },
      ],
    },
    {
      id: "saveTheDate",
      title: "Save The Date & Countdown",
      icon: <Calendar size={18} className="text-[#B94E2F]" />,
      fields: [
        {
          key: "heading",
          label: "Section Main Heading",
          desc: "'Reveal Our Big Day'",
          min: 24,
          max: 80,
          defaultVal: defaultTypographyConfig.saveTheDate?.heading ?? 56,
          sampleText: "Reveal Our Big Day",
        },
        {
          key: "subheading",
          label: "Scratch Heart Instruction",
          desc: "'Scratch the heart to reveal'",
          min: 12,
          max: 32,
          defaultVal: defaultTypographyConfig.saveTheDate?.subheading ?? 20,
          sampleText: "Scratch the heart to reveal",
        },
        {
          key: "countdown",
          label: "Countdown Timer Numbers",
          desc: "Digits for Days, Hours, Minutes, Seconds",
          min: 20,
          max: 60,
          defaultVal: defaultTypographyConfig.saveTheDate?.countdown ?? 36,
          sampleText: "24 • 12 • 45 • 30",
        },
        {
          key: "labels",
          label: "Countdown Unit Labels",
          desc: "'DAYS', 'HOURS', 'MINUTES', 'SECONDS'",
          min: 9,
          max: 22,
          defaultVal: defaultTypographyConfig.saveTheDate?.labels ?? 13,
          sampleText: "DAYS • HOURS • MINUTES",
        },
      ],
    },
    {
      id: "story",
      title: "Our Sacred Journey",
      icon: <Sparkles size={18} className="text-[#C9A45C]" />,
      fields: [
        {
          key: "heading",
          label: "Section Title",
          desc: "'DIFFERENT ROOTS • SAME DREAMS'",
          min: 20,
          max: 64,
          defaultVal: defaultTypographyConfig.story?.heading ?? 40,
          sampleText: "DIFFERENT ROOTS • SAME DREAMS",
        },
        {
          key: "chapterTitle",
          label: "Chapter Badge Titles",
          desc: "'The Meeting', 'The Journey', 'The Forever'",
          min: 12,
          max: 28,
          defaultVal: defaultTypographyConfig.story?.chapterTitle ?? 17,
          sampleText: "The Meeting • The Journey • The Forever",
        },
        {
          key: "chapterContent",
          label: "Story Paragraph Content",
          desc: "The story descriptions for each chapter",
          min: 12,
          max: 32,
          defaultVal: defaultTypographyConfig.story?.chapterContent ?? 19,
          sampleText: "Like a warm Kerala sunset and Assamese breeze...",
        },
      ],
    },
    {
      id: "events",
      title: "Sacred Ceremonies",
      icon: <Calendar size={18} className="text-[#641D2E]" />,
      fields: [
        {
          key: "heading",
          label: "Section Title",
          desc: "'Sacred Ceremonies'",
          min: 20,
          max: 64,
          defaultVal: defaultTypographyConfig.events?.heading ?? 42,
          sampleText: "Sacred Ceremonies",
        },
        {
          key: "date",
          label: "Ceremony Date Tag",
          desc: "'Monday, January 18, 2027'",
          min: 11,
          max: 26,
          defaultVal: defaultTypographyConfig.events?.date ?? 15,
          sampleText: "Monday, 18th January 2027",
        },
        {
          key: "title",
          label: "Ceremony Event Title",
          desc: "'Wedding Ceremony (Muhurtham)'",
          min: 20,
          max: 64,
          defaultVal: defaultTypographyConfig.events?.title ?? 40,
          sampleText: "Wedding Ceremony (Muhurtham)",
        },
        {
          key: "address",
          label: "Venue / Address Text",
          desc: "Address display (when unhidden)",
          min: 12,
          max: 28,
          defaultVal: defaultTypographyConfig.events?.address ?? 17,
          sampleText: "GP Milkat No 296 & 296/1, Mahabaleshwar",
        },
      ],
    },
    {
      id: "hotelStay",
      title: "Hotel & Stay Info",
      icon: <Building2 size={18} className="text-[#B94E2F]" />,
      fields: [
        {
          key: "heading",
          label: "Hotel Resort Name",
          desc: "'Mountain Breeze Mahableshwar'",
          min: 22,
          max: 70,
          defaultVal: defaultTypographyConfig.hotelStay?.hotelName ?? 50,
          sampleText: "Mountain Breeze Mahableshwar",
        },
        {
          key: "disclaimer",
          label: "Top Accommodation Disclaimer",
          desc: "'Accommodation & transportation is provided to guests...'",
          min: 12,
          max: 28,
          defaultVal: defaultTypographyConfig.hotelStay?.disclaimer ?? 16,
          sampleText: "Accommodation and transportation is only provided...",
        },
        {
          key: "details",
          label: "Check-in/Out & Travel Details",
          desc: "Times, room amenities & transit instructions",
          min: 12,
          max: 26,
          defaultVal: defaultTypographyConfig.hotelStay?.details ?? 16,
          sampleText: "Check-In: 18 Jan 2027 • 12:00 PM",
        },
        {
          key: "contacts",
          label: "Assistance Contact Names & Numbers",
          desc: "Mr. Vishal V, Ms. Priti K details",
          min: 12,
          max: 26,
          defaultVal: defaultTypographyConfig.hotelStay?.contacts ?? 16,
          sampleText: "Mr. Vishal V: +91 7400052735",
        },
      ],
    },
    {
      id: "rsvp",
      title: "RSVP Section",
      icon: <MessageSquare size={18} className="text-[#641D2E]" />,
      fields: [
        {
          key: "button",
          label: "RSVP Primary Button",
          desc: "'GIVE YOUR RSVP' button text",
          min: 12,
          max: 28,
          defaultVal: defaultTypographyConfig.rsvp?.button ?? 16,
          sampleText: "GIVE YOUR RSVP",
        },
        {
          key: "heading",
          label: "Selection Headers",
          desc: "'Will You Attend?' & 'Number of Guests'",
          min: 12,
          max: 28,
          defaultVal: defaultTypographyConfig.rsvp?.heading ?? 16,
          sampleText: "Will You Attend? • Number of Guests",
        },
        {
          key: "options",
          label: "Options & Count Selectors",
          desc: "'✓ Attending', '✕ Decline', guest counts 1-4",
          min: 11,
          max: 24,
          defaultVal: defaultTypographyConfig.rsvp?.options ?? 15,
          sampleText: "✓ Attending • Max 4 guests",
        },
        {
          key: "assistance",
          label: "Helpline & Query Line",
          desc: "Assistance phone contacts line",
          min: 11,
          max: 24,
          defaultVal: defaultTypographyConfig.rsvp?.assistance ?? 15,
          sampleText: "For RSVP assistance or queries: +91 7400052735",
        },
      ],
    },
  ];

  const handleUpdateField = (
    sectionId: keyof Omit<TypographyConfig, "globalScale">,
    fieldKey: string,
    val: number
  ) => {
    const updated = {
      ...currentTypo,
      [sectionId]: {
        ...(currentTypo[sectionId] || {}),
        [fieldKey]: val,
      },
    };
    onChange(updated);
  };

  const handleResetSection = (section: SectionGroup) => {
    const defaultSectionVals: Record<string, number> = {};
    section.fields.forEach((f) => {
      defaultSectionVals[f.key] = f.defaultVal;
    });

    const updated = {
      ...currentTypo,
      [section.id]: defaultSectionVals,
    };
    onChange(updated);
  };

  const handleResetAll = () => {
    onChange(defaultTypographyConfig);
  };

  const handleGlobalScaleChange = (scaleDelta: number) => {
    const newScale = Math.min(160, Math.max(70, (currentTypo.globalScale ?? 100) + scaleDelta));
    onChange({
      ...currentTypo,
      globalScale: newScale,
    });
  };

  return (
    <div className="space-y-6 pb-6 text-gray-800">
      {/* Top Banner: Global Scaling & Presets */}
      <div className="bg-gradient-to-br from-[#FFF9F3] via-white to-[#FFF0E6] p-5 sm:p-6 rounded-2xl border-2 border-[#C9A45C]/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C9A45C]/30 pb-3">
          <div>
            <h4 className="font-display text-lg text-[#641D2E] font-bold flex items-center gap-2">
              <Type size={20} className="text-[#B94E2F]" />
              Typography &amp; Font Size Controls
            </h4>
            <p className="text-xs text-[#765E52] mt-0.5">
              Easily increase or decrease font sizes for every heading, quote, card, and text block across all sections.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 text-xs text-[#765E52] hover:text-[#B94E2F] bg-white border border-[#C9A45C]/40 px-3 py-1.5 rounded-xl font-bold transition-all hover:bg-[#FFF9F3] cursor-pointer self-start sm:self-auto shrink-0"
            title="Reset all font sizes to factory defaults"
          >
            <RotateCcw size={12} />
            Reset All
          </button>
        </div>

        {/* Global Scaling Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-4 rounded-xl border border-[#C9A45C]/30">
          <div>
            <span className="text-xs font-bold text-[#641D2E] uppercase tracking-wider block">
              Global Font Scaling (All Sections)
            </span>
            <span className="text-[11px] text-[#765E52]">
              Scales the entire website font sizes proportionally with a single tap.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleGlobalScaleChange(-5)}
              className="w-9 h-9 rounded-xl bg-[#FFF9F3] hover:bg-[#F5EDD6] text-[#641D2E] border border-[#C9A45C]/50 flex items-center justify-center font-bold text-base transition-all active:scale-90 cursor-pointer shadow-xs"
              title="Decrease entire website font size"
            >
              <Minus size={15} />
            </button>
            <div className="px-3.5 py-1.5 bg-[#FFF9F3] border border-[#C9A45C]/50 rounded-xl font-mono text-sm font-bold text-[#641D2E] min-w-[65px] text-center shadow-xs">
              {currentTypo.globalScale ?? 100}%
            </div>
            <button
              type="button"
              onClick={() => handleGlobalScaleChange(5)}
              className="w-9 h-9 rounded-xl bg-[#B94E2F] hover:bg-[#8F3B22] text-white flex items-center justify-center font-bold text-base transition-all active:scale-90 cursor-pointer shadow-xs"
              title="Increase entire website font size"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Section by Section Tabs / Accordions */}
      <div className="space-y-3.5">
        {sections.map((section) => {
          const isExpanded = activeAccordion === section.id;
          const sectionValues = (currentTypo[section.id] as Record<string, number | undefined>) || {};

          return (
            <div
              key={section.id}
              className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? "border-[#B94E2F]/60 bg-white shadow-md ring-1 ring-[#B94E2F]/20"
                  : "border-[#C9A45C]/30 bg-[#FFF9F3]/40 hover:bg-[#FFF9F3]"
              }`}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => setActiveAccordion(isExpanded ? "" : section.id)}
                className="w-full flex items-center justify-between p-4 sm:p-4.5 cursor-pointer text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white border border-[#C9A45C]/30 shadow-xs shrink-0">
                    {section.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-[#641D2E]">
                        {section.title}
                      </span>
                      {section.badge && (
                        <span className="text-[10px] font-sans font-bold bg-[#B94E2F] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#765E52] block mt-0.5">
                      {section.fields.length} adjustable font elements
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {isExpanded && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetSection(section);
                      }}
                      className="text-[11px] text-[#765E52] hover:text-[#B94E2F] flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#C9A45C]/30 hover:bg-white bg-[#FFF9F3] transition-all cursor-pointer mr-2"
                      title={`Reset ${section.title} font sizes`}
                    >
                      <RotateCcw size={11} /> Reset
                    </button>
                  )}
                  <div className="w-7 h-7 rounded-full bg-white border border-[#C9A45C]/40 flex items-center justify-center text-[#765E52]">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="p-4 sm:p-6 border-t border-[#C9A45C]/20 bg-white space-y-5">
                  <div className="grid grid-cols-1 gap-5">
                    {section.fields.map((field) => {
                      const currentVal = sectionValues[field.key] ?? field.defaultVal;

                      return (
                        <div
                          key={field.key}
                          className="bg-[#FFF9F3]/60 border border-[#C9A45C]/30 rounded-2xl p-4 sm:p-4.5 space-y-3 hover:border-[#C9A45C]/60 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-sans font-bold text-xs sm:text-sm text-[#641D2E] block">
                                {field.label}
                              </span>
                              {field.desc && (
                                <span className="text-[11px] text-[#765E52] block">
                                  {field.desc}
                                </span>
                              )}
                            </div>

                            {/* Decrement / Number / Increment Stepper */}
                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateField(
                                    section.id,
                                    field.key,
                                    Math.max(field.min, currentVal - 1)
                                  )
                                }
                                disabled={currentVal <= field.min}
                                className="w-8 h-8 rounded-xl bg-white hover:bg-[#F5EDD6] text-[#641D2E] border border-[#C9A45C]/50 flex items-center justify-center font-bold text-sm transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-xs"
                                title="Decrease font size by 1px"
                              >
                                <Minus size={13} />
                              </button>

                              <div className="flex items-center">
                                <input
                                  type="number"
                                  min={field.min}
                                  max={field.max}
                                  value={currentVal}
                                  onChange={(e) => {
                                    const parsed = parseInt(e.target.value, 10);
                                    if (!isNaN(parsed)) {
                                      handleUpdateField(
                                        section.id,
                                        field.key,
                                        Math.min(field.max, Math.max(field.min, parsed))
                                      );
                                    }
                                  }}
                                  className="w-16 h-8 text-center bg-white border border-[#C9A45C]/50 rounded-xl font-mono text-xs font-bold text-[#641D2E] focus:outline-none focus:border-[#B94E2F] shadow-xs"
                                />
                                <span className="ml-1.5 text-xs text-[#765E52] font-semibold">px</span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateField(
                                    section.id,
                                    field.key,
                                    Math.min(field.max, currentVal + 1)
                                  )
                                }
                                disabled={currentVal >= field.max}
                                className="w-8 h-8 rounded-xl bg-[#B94E2F] hover:bg-[#8F3B22] text-white flex items-center justify-center font-bold text-sm transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-xs"
                                title="Increase font size by 1px"
                              >
                                <Plus size={13} />
                              </button>

                              {currentVal !== field.defaultVal && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateField(section.id, field.key, field.defaultVal)
                                  }
                                  className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 text-[#765E52] border border-[#C9A45C]/30 flex items-center justify-center transition-all cursor-pointer ml-1"
                                  title="Reset this element to default"
                                >
                                  <RotateCcw size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Range Slider for fast drag adjustment */}
                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-[10px] text-[#765E52] font-mono">{field.min}px</span>
                            <input
                              type="range"
                              min={field.min}
                              max={field.max}
                              value={currentVal}
                              onChange={(e) =>
                                handleUpdateField(section.id, field.key, Number(e.target.value))
                              }
                              className="flex-1 accent-[#B94E2F] cursor-pointer h-1.5 bg-[#C9A45C]/30 rounded-lg"
                            />
                            <span className="text-[10px] text-[#765E52] font-mono">{field.max}px</span>
                          </div>

                          {/* Live Dynamic Preview */}
                          <div className="bg-white rounded-xl p-3 border border-[#C9A45C]/20 shadow-xs flex items-center gap-3 overflow-hidden">
                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#C9A45C] bg-[#FFF9F3] px-2 py-1 rounded-md shrink-0 border border-[#C9A45C]/30">
                              Preview
                            </span>
                            <div className="truncate flex-1">
                              <span
                                style={{ fontSize: `${currentVal}px` }}
                                className="font-serif-premium text-[#641D2E] font-semibold tracking-wide leading-tight truncate block"
                              >
                                {field.sampleText}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
