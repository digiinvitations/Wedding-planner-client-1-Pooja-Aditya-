import configData from './data/wedding_config.json';

export interface DressCodeConfig {
  enabled: boolean;
  themeTitle: string;
  themeSubtitle: string;
  description: string;
  colorPalette: { name: string; hex: string }[];
  attireMen: string;
  attireWomen: string;
  note: string;
}

export interface HotelStayConfig {
  enabled: boolean;
  hotelName: string;
  tagline: string;
  checkIn: string;
  checkOut: string;
  address: string;
  roomDetails: string;
  amenities: string[];
  travelGuide: string;
  contactPerson: string;
  contactPhone: string;
  mapUrl: string;
  imageUrl?: string;
}

export interface RsvpSectionConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  deadlineText: string;
  contactPhone: string;
  contactName: string;
}

export interface StoryInvitationMessage {
  title: string;
  theMeeting: string;
  theJourney: string;
  theForever: string;
}

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
  showFloatingEditButton?: boolean;
  clientWorkspace?: string;
}

export const weddingConfig: WeddingConfig = configData as unknown as WeddingConfig;

