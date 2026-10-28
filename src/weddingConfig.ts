import configData from './data/wedding_config.json';

export interface DressCodeEvent {
  event: string;
  instructions: string[];
}

export interface DressCodeConfig {
  enabled: boolean;
  themeTitle?: string;
  themeSubtitle?: string;
  description?: string;
  events?: DressCodeEvent[];
  colorPalette?: { name: string; hex: string }[];
  attireMen?: string;
  attireWomen?: string;
  note?: string;
}

export interface HotelAssistanceContact {
  name: string;
  phone: string;
}

export interface HotelStayConfig {
  enabled: boolean;
  hotelName: string;
  tagline: string;
  checkIn: string;
  checkOut: string;
  address: string;
  roomDetails?: string;
  amenities?: string[];
  travelGuide?: string;
  contactPerson?: string;
  contactPhone?: string;
  mapUrl?: string;
  imageUrl?: string;
  assistanceContacts?: HotelAssistanceContact[];
}

export interface RsvpSectionConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  deadlineText?: string;
  contactPhone?: string;
  contactName?: string;
  googleFormUrl?: string;
}

export interface StoryInvitationMessage {
  title: string;
  theMeeting: string;
  theJourney: string;
  theForever: string;
}

export interface TypographyConfig {
  globalScale?: number;
  hero?: {
    shloka?: number;
    intro?: number;
    coupleNames?: number;
    parents?: number;
  };
  saveTheDate?: {
    heading?: number;
    subheading?: number;
    countdown?: number;
    labels?: number;
  };
  story?: {
    heading?: number;
    subheading?: number;
    chapterTitle?: number;
    chapterContent?: number;
  };
  events?: {
    heading?: number;
    date?: number;
    title?: number;
    address?: number;
  };
  dressCode?: {
    heading?: number;
    subheading?: number;
    ceremonyTitle?: number;
    instructions?: number;
  };
  hotelStay?: {
    heading?: number;
    hotelName?: number;
    disclaimer?: number;
    details?: number;
    contacts?: number;
  };
  rsvp?: {
    button?: number;
    heading?: number;
    options?: number;
    assistance?: number;
  };
  familyDetails?: {
    heading?: number;
    quote?: number;
    memberName?: number;
    parents?: number;
    relatives?: number;
  };
  footer?: {
    heading?: number;
    content?: number;
    coupleNames?: number;
    signature?: number;
  };
}

export const defaultTypographyConfig: TypographyConfig = {
  globalScale: 100,
  hero: {
    shloka: 18,
    intro: 18,
    coupleNames: 52,
    parents: 18,
  },
  saveTheDate: {
    heading: 56,
    subheading: 20,
    countdown: 36,
    labels: 13,
  },
  story: {
    heading: 40,
    subheading: 14,
    chapterTitle: 17,
    chapterContent: 19,
  },
  events: {
    heading: 42,
    date: 15,
    title: 40,
    address: 17,
  },
  dressCode: {
    heading: 40,
    subheading: 14,
    ceremonyTitle: 20,
    instructions: 16,
  },
  hotelStay: {
    heading: 44,
    hotelName: 50,
    disclaimer: 16,
    details: 16,
    contacts: 16,
  },
  rsvp: {
    button: 16,
    heading: 16,
    options: 15,
    assistance: 15,
  },
  familyDetails: {
    heading: 40,
    quote: 19,
    memberName: 30,
    parents: 19,
    relatives: 16,
  },
  footer: {
    heading: 50,
    content: 18,
    coupleNames: 60,
    signature: 19,
  },
};

export interface WeddingConfig {
  openingBackgroundImageUrl: string;
  openingSealImageUrl: string;
  openingVideoUrl: string;
  priorityOrder?: "groom" | "bride";
  bride: {
    name: string;
    fatherName: string;
    motherName: string;
    imageUrl: string;
    bio: string;
    introLineage?: string;
  };
  groom: {
    name: string;
    fatherName: string;
    motherName: string;
    imageUrl: string;
    bio: string;
    introLineage?: string;
  };
  weddingDate: string;
  displayDate: string;
  hashtag: string;
  musicUrl: string;
  youtubeEmbedUrl: string;
  envelopeIconUrl?: string;
  thankYouImageUrl?: string;
  heroTagline: string;
  heroImageUrl?: string;
  heroSettings: {
    shloka: string;
    introText: string;
    brideParents: string;
    groomParents: string;
    showPetals: boolean;
    ganeshaIconUrl?: string;
    bgVideoUrl?: string;
  };
  gallerySubtitle: string;
  galleryImages: {
    url: string;
    caption: string;
  }[];
  weddingEvents: {
    eventName: string;
    time: string;
    venueName: string;
    venueAddress: string;
    mapEmbedUrl: string;
    mapDirectionsUrl: string;
    thumbnailUrl?: string;
  }[];
  timeline?: {
    id: string;
    title: string;
    icon: string;
    description: string;
    date: string;
  }[];
  engagementDetails?: {
    time: string;
    mapDirectionsUrl: string;
    venueAddress: string;
    mapEmbedUrl: string;
    venueName: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
  };
  familyDetails: {
    message: string;
    welcomingText: string;
    names: string[];
  };
  welcomeMessage: {
    title: string;
    subtitle: string;
    text: string;
  };
  invitationStory?: StoryInvitationMessage;
  dressCode?: DressCodeConfig;
  hotelStay?: HotelStayConfig;
  rsvpSection?: RsvpSectionConfig;
  typography?: TypographyConfig;
  showFloatingEditButton?: boolean;
  showEventAddressAndMap?: boolean;
  showFamilyDetails?: boolean;
  clientWorkspace?: string;
}

export const weddingConfig: WeddingConfig = configData as unknown as WeddingConfig;

