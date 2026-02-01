// Store Customization Types - Website Builder
// This file contains all types for the enhanced store customization system

export type ThemeTemplate = 'modern' | 'minimal' | 'bold' | 'elegant' | 'traditional' | 'custom';

export type HeaderStyle = 'minimal' | 'standard' | 'bold' | 'centered';

export type HeroType = 'image' | 'video' | 'slideshow' | 'gradient' | 'none';

export type HeroHeight = 'small' | 'medium' | 'large' | 'full';

export type FontFamily = 
  | 'Inter' 
  | 'Roboto' 
  | 'Open Sans' 
  | 'Playfair Display' 
  | 'Montserrat' 
  | 'Lato'
  | 'Poppins'
  | 'Merriweather'
  | 'Source Sans Pro'
  | 'Raleway';

export type FontSize = 'small' | 'medium' | 'large';

export type SectionType = 
  | 'hero'
  | 'featured-products'
  | 'categories'
  | 'testimonials'
  | 'about-block'
  | 'trust-badges'
  | 'cta-banner'
  | 'video-embed'
  | 'image-gallery'
  | 'faq'
  | 'newsletter'
  | 'contact-form'
  | 'custom-html';

export type ProductCardStyle = 'card' | 'minimal' | 'detailed' | 'hover-reveal';

export type FooterStyle = 'simple' | 'detailed' | 'minimal' | 'centered';

// Color Palette
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  headerBackground: string;
  footerBackground: string;
  text: string;
  textMuted: string;
  border: string;
}

// Typography Settings
export interface TypographySettings {
  headingFont: FontFamily;
  bodyFont: FontFamily;
  baseFontSize: FontSize;
}

// Header Settings
export interface HeaderSettings {
  style: HeaderStyle;
  sticky: boolean;
  showSearch: boolean;
  showCart: boolean;
  transparent: boolean;
  announcement: {
    enabled: boolean;
    text: string;
    link?: string;
    backgroundColor?: string;
  };
}

// Hero Slide (for slideshow)
export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  cta?: {
    text: string;
    link: string;
  };
}

// Hero Settings
export interface HeroSettings {
  type: HeroType;
  height: HeroHeight;
  overlayOpacity: number;
  textAlignment: 'left' | 'center' | 'right';
  content: {
    title: string;
    subtitle: string;
    cta?: {
      text: string;
      link: string;
    };
  };
  backgroundImage?: string;
  backgroundVideo?: string;
  gradientStart?: string;
  gradientEnd?: string;
  slides?: HeroSlide[];
}

// Homepage Section
export interface HomepageSection {
  id: string;
  type: SectionType;
  enabled: boolean;
  order: number;
  title?: string;
  settings: Record<string, unknown>;
}

// Product Grid Settings
export interface ProductGridSettings {
  columns: 2 | 3 | 4 | 5;
  style: ProductCardStyle;
  showPrice: boolean;
  showMoq: boolean;
  showRating: boolean;
  imageAspectRatio: 'square' | 'portrait' | 'landscape';
  productsPerPage: number;
}

// Footer Settings
export interface FooterSettings {
  style: FooterStyle;
  showNewsletter: boolean;
  showSocialLinks: boolean;
  copyrightText?: string;
  customLinks: Array<{
    id: string;
    label: string;
    href: string;
  }>;
}

// Navigation Item
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  children?: NavigationItem[];
}

// Custom Page
export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  published: boolean;
}

// Trust Badge
export interface TrustBadge {
  id: string;
  icon: string;
  title: string;
  description: string;
}

// Testimonial
export interface Testimonial {
  id: string;
  name: string;
  company?: string;
  avatar?: string;
  content: string;
  rating: number;
}

// FAQ Item
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

// Social Links
export interface SocialLinks {
  website: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  whatsapp: string;
  twitter: string;
  tiktok: string;
  youtube: string;
  telegram: string;
}

// Contact Info
export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  businessHours?: string;
  mapEmbed?: string;
}

// Policies
export interface StorePolicies {
  shipping: string;
  returns: string;
  privacy: string;
  terms?: string;
}

// Main Store Customization Interface
export interface StoreCustomization {
  // Theme
  theme: ThemeTemplate;
  
  // Colors
  colors: ColorPalette;
  
  // Typography
  typography: TypographySettings;
  
  // Header
  header: HeaderSettings;
  
  // Hero
  hero: HeroSettings;
  
  // Homepage Sections
  sections: HomepageSection[];
  
  // Product Display
  productGrid: ProductGridSettings;
  
  // Footer
  footer: FooterSettings;
  
  // Navigation
  navigation: NavigationItem[];
  
  // Custom Pages
  pages: CustomPage[];
  
  // Trust Badges
  trustBadges: TrustBadge[];
  
  // Testimonials
  testimonials: Testimonial[];
  
  // FAQ
  faq: FAQItem[];
  
  // Social & Contact
  socialLinks: SocialLinks;
  contactInfo: ContactInfo;
  aboutUs: string;
  
  // Policies
  policies: StorePolicies;
  
  // Legacy fields for backwards compatibility
  primaryColor?: string;
  accentColor?: string;
  headerStyle?: HeaderStyle;
  showBanner?: boolean;
  bannerText?: string;
  logo?: string;
  favicon?: string;
  bio?: string;
}

// Default customization values
export const defaultStoreCustomization: StoreCustomization = {
  theme: 'modern',
  
  colors: {
    primary: '#f97316',
    secondary: '#1f2937',
    accent: '#fbbf24',
    background: '#ffffff',
    headerBackground: '#ffffff',
    footerBackground: '#1f2937',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
  },
  
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    baseFontSize: 'medium',
  },
  
  header: {
    style: 'standard',
    sticky: true,
    showSearch: true,
    showCart: true,
    transparent: false,
    announcement: {
      enabled: false,
      text: '',
      link: '',
    },
  },
  
  hero: {
    type: 'gradient',
    height: 'medium',
    overlayOpacity: 0.5,
    textAlignment: 'center',
    content: {
      title: 'Welcome to Our Store',
      subtitle: 'Discover amazing products at great prices',
      cta: {
        text: 'Shop Now',
        link: '/products',
      },
    },
    gradientStart: '#f97316',
    gradientEnd: '#fbbf24',
    slides: [],
  },
  
  sections: [
    {
      id: 'featured-products',
      type: 'featured-products',
      enabled: true,
      order: 0,
      title: 'Featured Products',
      settings: { count: 8 },
    },
    {
      id: 'trust-badges',
      type: 'trust-badges',
      enabled: true,
      order: 1,
      title: 'Why Choose Us',
      settings: {},
    },
    {
      id: 'about-block',
      type: 'about-block',
      enabled: false,
      order: 2,
      title: 'About Us',
      settings: {},
    },
    {
      id: 'testimonials',
      type: 'testimonials',
      enabled: false,
      order: 3,
      title: 'What Our Customers Say',
      settings: {},
    },
    {
      id: 'newsletter',
      type: 'newsletter',
      enabled: false,
      order: 4,
      title: 'Stay Updated',
      settings: {},
    },
    {
      id: 'faq',
      type: 'faq',
      enabled: false,
      order: 5,
      title: 'Frequently Asked Questions',
      settings: {},
    },
  ],
  
  productGrid: {
    columns: 4,
    style: 'card',
    showPrice: true,
    showMoq: true,
    showRating: true,
    imageAspectRatio: 'square',
    productsPerPage: 12,
  },
  
  footer: {
    style: 'detailed',
    showNewsletter: true,
    showSocialLinks: true,
    copyrightText: '',
    customLinks: [],
  },
  
  navigation: [
    { id: 'home', label: 'Home', href: '/', visible: true },
    { id: 'products', label: 'All Products', href: '/products', visible: true },
    { id: 'categories', label: 'Categories', href: '/categories', visible: true },
    { id: 'about', label: 'About Us', href: '/about', visible: true },
    { id: 'contact', label: 'Contact', href: '/contact', visible: true },
  ],
  
  pages: [],
  
  trustBadges: [
    { id: '1', icon: 'truck', title: 'Fast Shipping', description: 'Quick delivery to your door' },
    { id: '2', icon: 'shield', title: 'Secure Payment', description: 'Your payment is protected' },
    { id: '3', icon: 'message-circle', title: '24/7 Support', description: "We're here to help" },
  ],
  
  testimonials: [],
  
  faq: [],
  
  socialLinks: {
    website: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    whatsapp: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    telegram: '',
  },
  
  contactInfo: {
    email: '',
    phone: '',
    address: '',
    businessHours: '',
    mapEmbed: '',
  },
  
  aboutUs: '',
  
  policies: {
    shipping: '',
    returns: '',
    privacy: '',
    terms: '',
  },
};

// Theme presets
export const themePresets: Record<ThemeTemplate, Partial<StoreCustomization>> = {
  modern: {
    colors: {
      primary: '#f97316',
      secondary: '#1f2937',
      accent: '#fbbf24',
      background: '#ffffff',
      headerBackground: '#ffffff',
      footerBackground: '#1f2937',
      text: '#111827',
      textMuted: '#6b7280',
      border: '#e5e7eb',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      baseFontSize: 'medium',
    },
    header: {
      style: 'standard',
      sticky: true,
      showSearch: true,
      showCart: true,
      transparent: false,
      announcement: { enabled: false, text: '' },
    },
  },
  minimal: {
    colors: {
      primary: '#000000',
      secondary: '#374151',
      accent: '#6b7280',
      background: '#ffffff',
      headerBackground: '#ffffff',
      footerBackground: '#f9fafb',
      text: '#111827',
      textMuted: '#6b7280',
      border: '#e5e7eb',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      baseFontSize: 'medium',
    },
    header: {
      style: 'minimal',
      sticky: false,
      showSearch: true,
      showCart: true,
      transparent: false,
      announcement: { enabled: false, text: '' },
    },
  },
  bold: {
    colors: {
      primary: '#dc2626',
      secondary: '#111827',
      accent: '#fbbf24',
      background: '#ffffff',
      headerBackground: '#111827',
      footerBackground: '#111827',
      text: '#111827',
      textMuted: '#6b7280',
      border: '#e5e7eb',
    },
    typography: {
      headingFont: 'Montserrat',
      bodyFont: 'Open Sans',
      baseFontSize: 'medium',
    },
    header: {
      style: 'bold',
      sticky: true,
      showSearch: true,
      showCart: true,
      transparent: false,
      announcement: { enabled: false, text: '' },
    },
  },
  elegant: {
    colors: {
      primary: '#7c3aed',
      secondary: '#1f2937',
      accent: '#a78bfa',
      background: '#faf5ff',
      headerBackground: '#ffffff',
      footerBackground: '#1f2937',
      text: '#1f2937',
      textMuted: '#6b7280',
      border: '#e9d5ff',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Lato',
      baseFontSize: 'medium',
    },
    header: {
      style: 'centered',
      sticky: true,
      showSearch: true,
      showCart: true,
      transparent: false,
      announcement: { enabled: false, text: '' },
    },
  },
  traditional: {
    colors: {
      primary: '#1e40af',
      secondary: '#1f2937',
      accent: '#3b82f6',
      background: '#f8fafc',
      headerBackground: '#1e40af',
      footerBackground: '#1e3a5f',
      text: '#1f2937',
      textMuted: '#64748b',
      border: '#e2e8f0',
    },
    typography: {
      headingFont: 'Merriweather',
      bodyFont: 'Source Sans Pro',
      baseFontSize: 'medium',
    },
    header: {
      style: 'standard',
      sticky: true,
      showSearch: true,
      showCart: true,
      transparent: false,
      announcement: { enabled: false, text: '' },
    },
  },
  custom: defaultStoreCustomization,
};

// Available fonts for selection
export const availableFonts: { value: FontFamily; label: string; category: 'sans-serif' | 'serif' }[] = [
  { value: 'Inter', label: 'Inter', category: 'sans-serif' },
  { value: 'Roboto', label: 'Roboto', category: 'sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', category: 'sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'sans-serif' },
  { value: 'Lato', label: 'Lato', category: 'sans-serif' },
  { value: 'Poppins', label: 'Poppins', category: 'sans-serif' },
  { value: 'Raleway', label: 'Raleway', category: 'sans-serif' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro', category: 'sans-serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
  { value: 'Merriweather', label: 'Merriweather', category: 'serif' },
];

// Section type labels and icons
export const sectionTypeConfig: Record<SectionType, { label: string; icon: string; description: string }> = {
  'hero': { label: 'Hero Banner', icon: 'image', description: 'Large banner at top of page' },
  'featured-products': { label: 'Featured Products', icon: 'shopping-bag', description: 'Showcase your best products' },
  'categories': { label: 'Categories', icon: 'grid', description: 'Display product categories' },
  'testimonials': { label: 'Testimonials', icon: 'message-circle', description: 'Customer reviews and feedback' },
  'about-block': { label: 'About Block', icon: 'info', description: 'Company introduction section' },
  'trust-badges': { label: 'Trust Badges', icon: 'shield', description: 'Trust and quality indicators' },
  'cta-banner': { label: 'Call to Action', icon: 'megaphone', description: 'Promotional banner with button' },
  'video-embed': { label: 'Video', icon: 'play', description: 'Embedded YouTube/Vimeo video' },
  'image-gallery': { label: 'Image Gallery', icon: 'images', description: 'Photo gallery grid' },
  'faq': { label: 'FAQ', icon: 'help-circle', description: 'Frequently asked questions' },
  'newsletter': { label: 'Newsletter', icon: 'mail', description: 'Email signup form' },
  'contact-form': { label: 'Contact Form', icon: 'send', description: 'Customer inquiry form' },
  'custom-html': { label: 'Custom HTML', icon: 'code', description: 'Custom HTML content' },
};

// Helper to merge customization with defaults
export function mergeWithDefaults(customization: Partial<StoreCustomization> | null): StoreCustomization {
  if (!customization) return defaultStoreCustomization;
  
  return {
    ...defaultStoreCustomization,
    ...customization,
    colors: { ...defaultStoreCustomization.colors, ...customization.colors },
    typography: { ...defaultStoreCustomization.typography, ...customization.typography },
    header: { 
      ...defaultStoreCustomization.header, 
      ...customization.header,
      announcement: { ...defaultStoreCustomization.header.announcement, ...customization.header?.announcement },
    },
    hero: { 
      ...defaultStoreCustomization.hero, 
      ...customization.hero,
      content: { ...defaultStoreCustomization.hero.content, ...customization.hero?.content },
    },
    sections: customization.sections?.length ? customization.sections : defaultStoreCustomization.sections,
    productGrid: { ...defaultStoreCustomization.productGrid, ...customization.productGrid },
    footer: { ...defaultStoreCustomization.footer, ...customization.footer },
    navigation: customization.navigation?.length ? customization.navigation : defaultStoreCustomization.navigation,
    trustBadges: customization.trustBadges?.length ? customization.trustBadges : defaultStoreCustomization.trustBadges,
    socialLinks: { ...defaultStoreCustomization.socialLinks, ...customization.socialLinks },
    contactInfo: { ...defaultStoreCustomization.contactInfo, ...customization.contactInfo },
    policies: { ...defaultStoreCustomization.policies, ...customization.policies },
  };
}

// Generate CSS variables from customization
export function generateCSSVariables(customization: StoreCustomization): string {
  const { colors, typography } = customization;
  
  const fontSizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px',
  };
  
  return `
    :root {
      --store-primary: ${colors.primary};
      --store-secondary: ${colors.secondary};
      --store-accent: ${colors.accent};
      --store-background: ${colors.background};
      --store-header-bg: ${colors.headerBackground};
      --store-footer-bg: ${colors.footerBackground};
      --store-text: ${colors.text};
      --store-text-muted: ${colors.textMuted};
      --store-border: ${colors.border};
      --store-heading-font: '${typography.headingFont}', sans-serif;
      --store-body-font: '${typography.bodyFont}', sans-serif;
      --store-base-font-size: ${fontSizeMap[typography.baseFontSize]};
    }
  `;
}

// Generate Google Fonts import URL
export function generateGoogleFontsUrl(customization: StoreCustomization): string {
  const fonts = new Set([customization.typography.headingFont, customization.typography.bodyFont]);
  const fontParams = Array.from(fonts)
    .map(font => font.replace(/ /g, '+') + ':wght@400;500;600;700')
    .join('&family=');
  
  return `https://fonts.googleapis.com/css2?family=${fontParams}&display=swap`;
}
