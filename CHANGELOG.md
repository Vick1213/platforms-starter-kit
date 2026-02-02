# MarketPlace Platform - Development Changelog & System Report

**Generated:** February 1, 2026  
**Project:** Multi-Tenant E-commerce Marketplace  
**Stack:** Next.js 15, NextAuth.js v5, Redis Cloud, Tailwind CSS 4

---

## 🆕 Latest Update: Ably Real-time Chat & Notifications (February 1, 2026)

### Overview
Integrated Ably Chat SDK for real-time messaging between buyers and sellers. The chat now updates instantly without polling, includes typing indicators, presence (online/offline status), and a notification system. Offers sent through chat are delivered in real-time with accept/decline actions.

### New Dependencies
```json
{
  "@ably/chat": "^1.1.1",
  "ably": "^2.17.1"
}
```

### New Files Created

| File | Purpose |
|------|---------|
| `lib/ably.ts` | Ably client configuration, room naming conventions, message metadata types, notification templates |
| `lib/ably-server.ts` | Server-side Ably client for publishing messages/notifications from API routes |
| `app/api/ably/token/route.ts` | Token authentication endpoint for Ably - creates clientId based on user/seller, sets capabilities |
| `components/ably-provider.tsx` | React context providers - AblyChatProvider, NotificationContext with hooks |
| `components/chat/realtime-chat-window.tsx` | Full real-time chat component with messages, typing, presence, offer support |
| `components/notification-bell.tsx` | Notification bell dropdown with unread count, icons, and browser notification support |

### Key Features

#### Real-time Messaging
- **Instant message delivery** - Messages appear immediately via Ably Chat SDK
- **Message history** - Previous messages loaded from Ably's 30-day retention
- **Typing indicators** - Shows when other party is typing with animation
- **Presence** - Online/offline status with green indicator dot

#### Notification System
- **In-app notifications** - Bell icon with unread count badge
- **Browser notifications** - Native browser notifications with permission request
- **Notification types**: new_inquiry, new_message, offer_sent, offer_received, offer_accepted, offer_declined, order_created, invoice_sent, payment_received

#### Chat Room Types
- `inquiry:{id}` - Product inquiry conversations
- `conversation:{id}` - Direct buyer-seller conversations
- `notifications:seller:{sellerId}` - Seller notification channel
- `notifications:user:{userId}` - Buyer notification channel

### API Updates

#### Offers API (`app/api/offers/route.ts`)
- Now sends real-time offer message to chat via `sendOfferToChat()`
- Notifies buyer via `notifications.offerReceived()`

#### Offer Accept (`app/api/offers/[id]/accept/route.ts`)
- Sends `notifications.offerAccepted()` to seller
- Sends `notifications.orderCreated()` to seller
- Publishes system message to chat

#### Offer Decline (`app/api/offers/[id]/decline/route.ts`)
- Sends `notifications.offerDeclined()` to seller
- Publishes system message to chat

#### Chat API (`app/api/chat/route.ts`)
- Now publishes messages via Ably for real-time delivery
- Sends `notifications.newMessage()` to recipient

#### Enquiry API (`app/api/chat/enquiry/route.ts`)
- Sends `notifications.newInquiry()` to seller when product enquiry submitted

### Environment Variables Required
```env
ABLY_API_KEY=your-ably-api-key
```

### Provider Integration
Updated `app/providers.tsx` to wrap app with `AblyChatProvider` for real-time functionality.

### Usage Example
```tsx
import { RealtimeChatWindow } from '@/components/chat/realtime-chat-window';

<RealtimeChatWindow
  roomType="inquiry"
  roomId={inquiry.id}
  sellerId={seller.id}
  sellerName={seller.businessName}
  buyerName={buyer.name}
  currentUserType="buyer"
  currentUserName={user.name}
  primaryColor="#f97316"
  onSendOffer={() => setShowOfferForm(true)}
/>
```

---

## Previous Update: Purchase Flow & Offer/Invoice System (February 1, 2026)

### Overview
Implemented a comprehensive purchase flow with flexible product modes (direct purchase or inquiry-based), seller offer system, and invoicing. Products can now be configured by sellers to allow direct checkout, require quotes/offers, or both. Sellers can send formal offers through the inquiry chat, and buyers can accept offers to create orders with automatic invoice generation.

### New Files Created

| File | Purpose |
|------|---------|
| `lib/offer-types.ts` | Type definitions for Offer, OfferItem, CreateOfferInput with helpers (generateOfferNumber, calculateOfferTotals, isOfferExpired) |
| `lib/invoice-types.ts` | Type definitions for Invoice, InvoiceItem, InvoiceAddress with helpers (generateInvoiceNumber, getInvoiceStatusInfo) |
| `app/api/offers/route.ts` | RESTful offers API - POST (create), GET (retrieve by id/number/inquiry/email) |
| `app/api/offers/[id]/accept/route.ts` | Accept offer endpoint - creates Order + Invoice, updates inquiry status |
| `app/api/offers/[id]/decline/route.ts` | Decline offer endpoint with optional reason, adds message to inquiry chat |
| `app/api/invoices/route.ts` | RESTful invoices API - GET/POST/PATCH for invoice management |
| `app/store/[subdomain]/products/[slug]/product-cta.tsx` | Conditional CTA component (Add to Cart vs Request Quote) based on purchaseMode |
| `components/offer-card.tsx` | Display offers in chat with items, totals, terms, accept/decline buttons |
| `components/offer-form.tsx` | Form for sellers to create and send offers in inquiry chat |
| `app/store/[subdomain]/offer/[offerId]/page.tsx` | Full offer acceptance page with shipping form and order confirmation |
| `app/store/[subdomain]/invoice/[invoiceId]/page.tsx` | Printable invoice view page with all details |

### Prisma Schema Updates

#### New Enums
```prisma
enum PurchaseMode {
  DIRECT        // Direct checkout only
  ENQUIRY_ONLY  // Must request quote
  BOTH          // Both options available
}

enum OfferStatus {
  PENDING, ACCEPTED, DECLINED, EXPIRED, WITHDRAWN
}

enum InvoiceStatus {
  DRAFT, SENT, PAID, OVERDUE, CANCELLED, REFUNDED
}
```

#### New Models
- **Order** - Customer orders with items, addresses, totals, status
- **OrderItem** - Line items for orders
- **Offer** - Seller quotes with items, terms, expiration
- **OfferItem** - Line items for offers with pricing
- **Invoice** - Generated invoices with billing/shipping, due dates, payment status

### Features Implemented

#### Product Purchase Modes
- ✅ **DIRECT** - Shows Add to Cart + Buy Now buttons
- ✅ **ENQUIRY_ONLY** - Shows Request Quote form only
- ✅ **BOTH** - Shows Add to Cart + optional "Request Custom Quote"

#### Offer System
- ✅ **Create Offers** - Sellers can create detailed quotes with multiple items
- ✅ **Offer Details** - Product name, quantity, original/offered price, units, notes
- ✅ **Pricing** - Subtotal, shipping, tax, discount, total calculations
- ✅ **Terms** - Validity period, payment terms, shipping terms, delivery time
- ✅ **Accept/Decline** - Buyers can accept (creates order) or decline (with reason)
- ✅ **Expiration** - Offers auto-expire after validity period

#### Invoice System
- ✅ **Auto-Generation** - Invoice created when offer is accepted
- ✅ **Invoice Numbers** - Format: INV-YYMM-XXXXX
- ✅ **Billing/Shipping** - Full address support
- ✅ **Status Tracking** - Draft, Sent, Paid, Overdue, Cancelled, Refunded
- ✅ **Print View** - Clean printable invoice layout

#### Chat Integration
- ✅ **Offer Messages** - New 'offer' message type in chat
- ✅ **Offer Cards** - Rich display of offers in chat with actions
- ✅ **Accept/Decline Buttons** - Inline actions for buyers

### Purchase Flow

```
Product Page
    │
    ├─── Direct Mode ──────► Add to Cart ──► Checkout ──► Order
    │
    └─── Enquiry Mode ──────► Send Inquiry ──► Chat with Seller
                                                    │
                                            Seller sends Offer
                                                    │
                                            Buyer views Offer
                                                    │
                              ┌─────────────────────┴────────────────────┐
                              │                                          │
                        Accept Offer                              Decline Offer
                              │                                          │
                     Enter Shipping Address                      (with reason)
                              │
                        Create Order + Invoice
                              │
                     Order Confirmation Page
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/offers` | POST | Create offer (seller only) |
| `/api/offers` | GET | Get offer by id/number/inquiry/email |
| `/api/offers/[id]/accept` | POST | Accept offer, create order + invoice |
| `/api/offers/[id]/decline` | POST | Decline offer with reason |
| `/api/invoices` | GET | Get invoice by id/number/order/email |
| `/api/invoices` | POST | Create invoice for order |
| `/api/invoices` | PATCH | Update invoice status/payment |

### Type Definitions

```typescript
// Offer
interface Offer {
  id: string;
  offerNumber: string;  // QUO-TIMESTAMP-XXXX
  sellerId: string;
  inquiryId?: string;
  buyerEmail: string;
  status: OfferStatus;
  items: OfferItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  validUntil?: Date;
  paymentTerms?: string;
  deliveryTime?: string;
}

// Invoice
interface Invoice {
  id: string;
  invoiceNumber: string;  // INV-YYMM-XXXXX
  status: InvoiceStatus;
  sellerId: string;
  orderId?: string;
  buyerEmail: string;
  items: InvoiceItem[];
  total: number;
  dueDate?: Date;
  paidAt?: Date;
}
```

### Migration Required
Run the following to apply schema changes:
```bash
npx prisma db push
# or
npx prisma migrate dev --name add-offers-invoices
```

---

## 🛒 Shopping Cart & Checkout System (February 1, 2026)

### Overview
Added a complete e-commerce shopping cart and checkout system, along with missing store pages (products listing, categories, about, contact). Customers can now browse products, add items to cart, and complete a multi-step checkout process.

### New Files Created

| File | Purpose |
|------|---------|
| `lib/cart-types.ts` | Type definitions for Cart, CartItem, Order, ShippingAddress, PaymentMethod with helper functions |
| `lib/cart-db.ts` | Redis operations for cart persistence (getCart, saveCart, addToCart, clearCart) and order management |
| `app/api/cart/route.ts` | RESTful cart API (GET/POST/PATCH/DELETE) with session-based cookies |
| `app/api/orders/route.ts` | Order creation and retrieval API endpoints |
| `app/store/[subdomain]/products/page.tsx` | Product listing page with search, sort, and grid display |
| `app/store/[subdomain]/categories/page.tsx` | Categories page grouped by product data |
| `app/store/[subdomain]/about/page.tsx` | About page with seller story, stats, and testimonials |
| `app/store/[subdomain]/contact/page.tsx` | Contact form with seller info and business hours |
| `app/store/[subdomain]/cart/page.tsx` | Shopping cart UI with quantity controls and order summary |
| `app/store/[subdomain]/checkout/page.tsx` | Multi-step checkout (shipping → payment → review) |
| `app/store/[subdomain]/order-confirmation/page.tsx` | Order confirmation with details and next steps |
| `app/store/[subdomain]/products/[slug]/add-to-cart-button.tsx` | Client component for adding products to cart |

### Features Implemented

#### Shopping Cart
- ✅ **Session-based Cart** - Cart persists via cookies for 7 days using Redis storage
- ✅ **Add to Cart** - Quantity selector with MOQ validation on product pages
- ✅ **Cart Management** - Update quantities, remove items, clear cart
- ✅ **Cart Totals** - Auto-calculated subtotal, tax, shipping, and total

#### Checkout Process
- ✅ **Multi-step Flow** - Shipping → Payment → Review with progress indicator
- ✅ **Shipping Form** - Full address collection with validation
- ✅ **Payment Methods** - Request for Quote, Bank Transfer, PayPal, Credit Card options
- ✅ **Order Review** - Summary of items, addresses, and totals before submission
- ✅ **Order Confirmation** - Detailed confirmation page with order number and next steps

#### Store Pages
- ✅ **Products Listing** - Search, sort (price, newest, name), responsive grid
- ✅ **Categories Page** - Auto-generated from product categories
- ✅ **About Page** - Seller story, years in business, rating display, testimonials
- ✅ **Contact Page** - Contact form, business hours, address, social links

### Cart & Order Types

```typescript
interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  moq?: number;
  image?: string;
  sellerId: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cart` | GET | Fetch current cart for subdomain |
| `/api/cart` | POST | Add item to cart |
| `/api/cart` | PATCH | Update item quantity |
| `/api/cart` | DELETE | Remove item or clear cart |
| `/api/orders` | POST | Create new order from cart |
| `/api/orders` | GET | Retrieve order by number/email |

---

## 🏪 Store Builder (January 31, 2026)

### Overview
Added a comprehensive website builder for seller stores, allowing sellers to customize their storefronts with themes, colors, typography, sections, and more - similar to Shopify or Squarespace.

### New Files Created

| File | Purpose |
|------|---------|
| `lib/store-customization-types.ts` | Comprehensive type system (688 lines) with all customization interfaces, theme presets, and helper functions |
| `components/store-builder/live-preview.tsx` | Real-time iframe preview with device switcher (desktop/tablet/mobile) and fullscreen mode |
| `components/store-builder/theme-selector.tsx` | 5 theme presets (Modern, Minimal, Bold, Elegant, Traditional) with one-click application |
| `components/store-builder/section-builder.tsx` | Drag-drop section reordering with visibility toggles and 6+ section types |
| `components/store-builder/color-typography-editor.tsx` | 9-color palette editor + Google Fonts selector with 10 font families |
| `components/store-builder/hero-editor.tsx` | Hero customization (gradient/image/video/slideshow/none) with height and alignment controls |
| `components/store-builder/navigation-editor.tsx` | Menu management with add/edit/remove/reorder functionality |
| `components/store-builder/custom-pages-editor.tsx` | Custom page creation with templates (About, FAQ, Contact, Terms, Privacy) |
| `components/store-builder/index.ts` | Barrel export file for all store builder components |

### Modified Files

| File | Changes |
|------|---------|
| `app/seller/settings/page.tsx` | Complete rewrite with 9-tab store builder UI featuring live preview panel |
| `app/store/[subdomain]/page.tsx` | Updated to render all customization options dynamically (header styles, hero types, sections, footer styles) |
| `app/api/seller/customization/route.ts` | Updated to use new types with `mergeWithDefaults()` for backwards compatibility |

### Features Implemented

#### Phase 1: Enhanced Branding
- ✅ **Color Palette System** - 9 customizable colors (primary, secondary, accent, background, header/footer backgrounds, text, muted text, border)
- ✅ **Typography Settings** - 10 Google Fonts (Inter, Roboto, Open Sans, Playfair Display, Montserrat, Lato, Poppins, Merriweather, Source Sans Pro, Raleway) with size options
- ✅ **Header Styles** - 4 layouts (Standard, Minimal, Bold, Centered) with sticky/transparent options
- ✅ **Announcement Bar** - Customizable top banner with optional link

#### Phase 2: Page Builder
- ✅ **Hero Section Types** - Gradient, Image, Video, Slideshow, or None with height controls (small/medium/large/full)
- ✅ **Homepage Sections** - Featured Products, Trust Badges, About Block, Testimonials, FAQ, Newsletter, CTA Banner
- ✅ **Section Builder** - Drag-drop reordering, visibility toggles, section-specific settings
- ✅ **Product Grid Customization** - Columns (2-5), card styles, aspect ratios, show/hide price/MOQ/rating

#### Phase 3: Advanced Features
- ✅ **Theme Templates** - 5 pre-built themes with one-click application
- ✅ **Live Preview** - Real-time preview with device switching (desktop/tablet/mobile) and fullscreen
- ✅ **Navigation Editor** - Custom menu items with drag-drop reordering
- ✅ **Custom Pages** - Create About, FAQ, Contact, Terms, Privacy pages with templates
- ✅ **Footer Styles** - 4 layouts (Detailed, Simple, Minimal, Centered)
- ✅ **Trust Badges** - Customizable icons and descriptions
- ✅ **Testimonials** - Customer reviews with ratings and avatars
- ✅ **FAQ System** - Accordion-style frequently asked questions

### Type System

```typescript
// Main customization interface
interface StoreCustomization {
  theme: ThemeTemplate;
  colors: ColorPalette;
  typography: TypographySettings;
  header: HeaderSettings;
  hero: HeroSettings;
  sections: HomepageSection[];
  productGrid: ProductGridSettings;
  footer: FooterSettings;
  navigation: NavigationItem[];
  pages: CustomPage[];
  trustBadges: TrustBadge[];
  testimonials: Testimonial[];
  faq: FAQItem[];
  socialLinks: SocialLinks;
  contactInfo: ContactInfo;
  policies: StorePolicies;
}
```

### Helper Functions

| Function | Purpose |
|----------|---------|
| `mergeWithDefaults(customization)` | Safely merges partial customization with defaults for backwards compatibility |
| `generateCSSVariables(customization)` | Generates CSS custom properties from colors and typography |
| `generateGoogleFontsUrl(customization)` | Creates Google Fonts import URL for selected fonts |

### Store Page Rendering

The store page now dynamically renders based on customization:

1. **Header** - Renders one of 4 header styles with optional announcement bar
2. **Hero** - Displays gradient, image, video, slideshow, or nothing based on settings
3. **Sections** - Maps through enabled sections sorted by order, rendering appropriate component
4. **Footer** - Renders one of 4 footer styles with social links and contact info

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Files Created & Modified](#files-created--modified)
4. [Authentication System](#authentication-system)
5. [Portal Structure](#portal-structure)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Environment Configuration](#environment-configuration)
9. [How Everything Works](#how-everything-works)
10. [Testing Guide](#testing-guide)
11. [Deployment Notes](#deployment-notes)

---

## 🎯 Project Overview

Built a production-ready multi-tenant marketplace platform with:

- **Three distinct portals:** Admin, Seller, User
- **Secret admin access** via SHA-256 hashed subdomain
- **OAuth integration** (Google, Apple) + credentials login
- **Seller storefronts** with custom subdomains
- **Modern UI** inspired by Alibaba × Amazon

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MARKETPLACE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   ADMIN      │  │   SELLER     │  │    USER      │          │
│  │   PORTAL     │  │   PORTAL     │  │   PORTAL     │          │
│  │              │  │              │  │              │          │
│  │ admin-{hash} │  │   seller.    │  │  {store}.    │          │
│  │ .domain.com  │  │  domain.com  │  │  domain.com  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │ MIDDLEWARE  │                               │
│                    │  (routing)  │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐            │
│  │  NextAuth   │  │   Redis     │  │   Next.js   │            │
│  │    Auth     │  │   Cloud     │  │   App       │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files Created & Modified

### New Files Created

| File | Purpose |
|------|---------|
| `lib/auth-config.ts` | Central auth configuration, portal detection, role enums |
| `lib/types.ts` | TypeScript interfaces for User, Seller, Product, etc. |
| `lib/db.ts` | Database operations via Redis |
| `auth.ts` | NextAuth.js v5 configuration |
| `app/providers.tsx` | SessionProvider wrapper |
| `app/auth/login/page.tsx` | User login page with OAuth + credentials |
| `app/auth/register/page.tsx` | User registration page |
| `app/auth/seller-register/page.tsx` | Seller registration (2-step) |
| `app/auth/error/page.tsx` | Authentication error page |
| `app/seller/page.tsx` | Seller portal entry |
| `app/seller/dashboard.tsx` | Seller dashboard UI |
| `app/admin/dashboard.tsx` | Admin dashboard with tabs |
| `app/store/[subdomain]/page.tsx` | Individual seller storefront |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth API route |
| `app/api/auth/register/route.ts` | User registration API |
| `app/api/seller/register/route.ts` | Seller registration API |
| `app/api/seller/check-subdomain/route.ts` | Subdomain availability check |
| `app/api/admin/setup/route.ts` | Admin user creation endpoint |
| `.env.example` | Environment variable template |
| `.env.local` | Local environment configuration |

### Modified Files

| File | Changes |
|------|---------|
| `middleware.ts` | Complete rewrite for portal-based routing |
| `app/page.tsx` | Marketplace homepage with Alibaba/Amazon UI |
| `app/layout.tsx` | Added SessionProvider |
| `app/admin/page.tsx` | Admin portal page |
| `lib/redis.ts` | Switched from Upstash to Redis Cloud client |
| `lib/subdomains.ts` | Fixed mget type issues |
| `README.md` | Updated documentation |

---

## 🔐 Authentication System

### User Roles

```typescript
enum UserRole {
  USER = 'user',      // Regular customers
  SELLER = 'seller',  // Store owners
  ADMIN = 'admin'     // Platform administrators
}
```

### Portal Types

```typescript
enum PortalType {
  MAIN = 'main',      // Main marketplace (domain.com)
  ADMIN = 'admin',    // Admin portal (admin-{hash}.domain.com)
  SELLER = 'seller',  // Seller portal (seller.domain.com)
  STORE = 'store'     // Individual stores ({store}.domain.com)
}
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTH FLOW                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User visits /auth/login                                  │
│          │                                                   │
│          ▼                                                   │
│  2. Choose auth method:                                      │
│     ├── Google OAuth ──► Google Sign-In ──┐                 │
│     ├── Apple OAuth ───► Apple Sign-In ───┤                 │
│     └── Credentials ───► Email/Password ──┤                 │
│                                            │                 │
│          ┌────────────────────────────────┘                 │
│          ▼                                                   │
│  3. NextAuth processes authentication                        │
│          │                                                   │
│          ▼                                                   │
│  4. JWT token created with user role                        │
│          │                                                   │
│          ▼                                                   │
│  5. Redirect based on role:                                  │
│     ├── Admin ──► /admin/dashboard                          │
│     ├── Seller ─► /seller/dashboard                         │
│     └── User ───► / (homepage)                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Secret Admin Subdomain

The admin portal uses a SHA-256 hashed subdomain for security:

```javascript
// Key: "marketplace-admin-2026"
// Hash: SHA-256 → first 12 characters
// Result: admin-fe7b9bce29ac

// Admin URL: https://admin-fe7b9bce29ac.yourdomain.com
```

---

## 🌐 Portal Structure

| Portal | Subdomain | Purpose | Access |
|--------|-----------|---------|--------|
| **Main** | `yourdomain.com` | Customer marketplace | Public |
| **Admin** | `admin-fe7b9bce29ac.yourdomain.com` | Platform management | Admin only |
| **Seller** | `seller.yourdomain.com` | Seller dashboard | Sellers |
| **Stores** | `{storename}.yourdomain.com` | Individual storefronts | Public |

### Middleware Routing Logic

```typescript
// middleware.ts - Simplified logic

1. Extract subdomain from hostname
2. Determine portal type:
   - Starts with "admin-" → ADMIN portal
   - Equals "seller" or "sellers" → SELLER portal
   - Other subdomain → STORE portal
   - No subdomain → MAIN portal
3. Apply access controls:
   - Block admin pages from non-admin subdomains
   - Block seller pages from store subdomains
   - Allow public access to store pages
```

---

## 💾 Database Schema

### User

```typescript
interface User {
  id: string;              // user_1234567890_abc123
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### Seller

```typescript
interface Seller {
  id: string;              // seller_1234567890_abc123
  userId: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string | null;
  description: string | null;
  logo: string | null;
  banner: string | null;
  subdomain: string;       // unique store subdomain
  customDomain: string | null;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  totalSales: number;
  createdAt: number;
  updatedAt: number;
}
```

### Redis Key Patterns

```
user:{id}                    → User object
user:email:{email}           → User ID
user:credentials:{id}        → User with hashed password
user:provider:{provider}:{email} → User ID

seller:{id}                  → Seller object
seller:user:{userId}         → Seller ID
seller:subdomain:{subdomain} → Seller ID
seller:domain:{domain}       → Seller ID
seller:settings:{id}         → Seller settings
```

---

## 🔌 API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | ALL | NextAuth.js handler |
| `/api/auth/register` | POST | User registration |
| `/api/auth/session` | GET | Get current session |

### Seller

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/seller/register` | POST | Seller registration |
| `/api/seller/check-subdomain` | GET | Check subdomain availability |

### Admin

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/setup` | POST | Create admin user (requires setup key) |

### Example: Create Admin User

```bash
curl -X POST https://yourdomain.com/api/admin/setup \
  -H "Content-Type: application/json" \
  -H "x-admin-setup-key: marketplace-admin-2026" \
  -d '{
    "name": "Admin",
    "email": "admin@example.com",
    "password": "SecurePassword123"
  }'
```

---

## ⚙️ Environment Configuration

### Required Variables

```env
# Redis Cloud
REDIS_URL=redis://default:password@host:port

# NextAuth.js
AUTH_SECRET=your-32-character-secret
AUTH_URL=https://yourdomain.com

# Admin
ADMIN_SUBDOMAIN=admin-fe7b9bce29ac
ADMIN_SECRET_KEY=marketplace-admin-2026

# OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# Domain
NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com
```

### Google OAuth Redirect URIs

```
# Production
https://yourdomain.com/api/auth/callback/google

# Development
http://localhost:3000/api/auth/callback/google
```

---

## 🔄 How Everything Works

### 1. User Registration Flow

```
User → /auth/register → Fill form → POST /api/auth/register
                                            │
                                            ▼
                                    Create user in Redis
                                    Hash password (bcrypt)
                                            │
                                            ▼
                                    Redirect to /auth/login
```

### 2. Seller Registration Flow

```
User → /auth/seller-register → Step 1: Account details
                                       │
                                       ▼
                               Step 2: Business details
                               Check subdomain availability
                                       │
                                       ▼
                               POST /api/seller/register
                                       │
                                       ▼
                               Create seller in Redis
                               Update user role to SELLER
                               Status = 'pending'
                                       │
                                       ▼
                               Await admin approval
```

### 3. Subdomain Routing Flow

```
Request: https://mystore.yourdomain.com
              │
              ▼
        middleware.ts
              │
              ▼
    Extract subdomain: "mystore"
              │
              ▼
    Check portal type:
    - Not admin-* prefix
    - Not "seller"
    - Therefore: STORE portal
              │
              ▼
    Rewrite to: /store/mystore
              │
              ▼
    app/store/[subdomain]/page.tsx
              │
              ▼
    Fetch seller data by subdomain
    Render storefront
```

### 4. Admin Access Flow

```
Request: https://admin-fe7b9bce29ac.yourdomain.com
              │
              ▼
        middleware.ts
              │
              ▼
    Subdomain starts with "admin-"
    Verify hash matches ADMIN_SUBDOMAIN
              │
              ▼
    Portal type: ADMIN
              │
              ▼
    Rewrite to: /admin
              │
              ▼
    app/admin/page.tsx
    Check user session & role
              │
              ▼
    If role === ADMIN → Show dashboard
    Else → Redirect to login
```

---

## 🧪 Testing Guide

### Local Development

1. **Start the server:**
   ```bash
   pnpm dev
   ```

2. **Access portals:**
   - Main: http://localhost:3000
   - Admin: http://admin-fe7b9bce29ac.localhost:3000
   - Seller: http://seller.localhost:3000

3. **Create admin user:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/setup \
     -H "Content-Type: application/json" \
     -H "x-admin-setup-key: marketplace-admin-2026" \
     -d '{"name":"Admin","email":"admin@test.com","password":"Test1234"}'
   ```

4. **Test registration:**
   - Visit http://localhost:3000/auth/register
   - Create a user account
   - Login at http://localhost:3000/auth/login

5. **Test seller registration:**
   - Visit http://localhost:3000/auth/seller-register
   - Complete both steps
   - Check subdomain availability

### Vercel Deployment

⚠️ **Note:** Vercel preview deployments don't support wildcard subdomains. For full functionality:

1. Add a custom domain in Vercel
2. Configure wildcard DNS (`*.yourdomain.com`)
3. Update `NEXT_PUBLIC_ROOT_DOMAIN` and `AUTH_URL`

---

## 🚀 Deployment Notes

### Vercel Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
REDIS_URL
AUTH_SECRET
AUTH_URL (set to your production URL)
ADMIN_SUBDOMAIN
ADMIN_SECRET_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_ROOT_DOMAIN
```

### Custom Domain Setup

1. **Add domain to Vercel:**
   - Add `yourdomain.com`
   - Add `*.yourdomain.com` (wildcard)

2. **DNS Configuration:**
   ```
   A     @     76.76.21.21
   CNAME *     cname.vercel-dns.com
   ```

3. **Update environment:**
   ```env
   AUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com
   ```

---

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Complete | Credentials + OAuth |
| Google OAuth | ✅ Configured | Needs redirect URI setup |
| Apple OAuth | ⏳ Pending | Needs Apple Developer account |
| Admin Portal | ✅ Complete | Secret subdomain access |
| Seller Portal | ✅ Complete | Dashboard + registration |
| Store Pages | ✅ Complete | Dynamic subdomain routing |
| Redis Integration | ✅ Working | Redis Cloud connected |
| Middleware Routing | ✅ Working | All portals routing correctly |
| Build Status | ✅ Passing | All type errors fixed |

---

## 🐛 Issues Fixed

1. **Edge Runtime crypto error** - Removed Node.js crypto import, used pre-computed hash
2. **Redis mget type errors** - Fixed generic type parameters
3. **useSearchParams Suspense** - Wrapped components in Suspense boundaries
4. **Google OAuth credentials** - Swapped incorrectly placed ID and Secret
5. **sIsMember boolean type** - Added Boolean() conversion

---

## 📝 Next Steps

1. **Set up Google OAuth redirect URIs** in Google Cloud Console
2. **Configure custom domain** on Vercel for subdomain support
3. **Create first admin user** via API
4. **Add product management** for sellers
5. **Implement payment processing** (Stripe)
6. **Add order management** system

---

*Generated by GitHub Copilot for MarketPlace Platform*
