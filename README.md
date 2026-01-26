# MarketPlace - Multi-Tenant E-commerce Platform

A production-ready multi-tenant marketplace built with Next.js 15, featuring custom subdomains for sellers, role-based authentication, and a modern Alibaba/Amazon-inspired UI.

## Features

- ✅ **Multi-tenant architecture** with subdomain routing
- ✅ **Role-based authentication** (Admin, Seller, User)
- ✅ **OAuth support** (Google, Apple, Credentials)
- ✅ **Secret admin subdomain** (SHA-256 hashed for security)
- ✅ **Seller portal** with dashboard and store management
- ✅ **Customer storefronts** per seller subdomain
- ✅ **Modern marketplace UI** (Alibaba × Amazon inspired)
- ✅ **Redis storage** with Upstash
- ✅ **Vercel deployment** ready with wildcard domains

## Tech Stack

- [Next.js 15](https://nextjs.org/) with App Router & Turbopack
- [React 19](https://react.dev/)
- [NextAuth.js v5](https://authjs.dev/) for authentication
- [Upstash Redis](https://upstash.com/) for data storage
- [Tailwind 4](https://tailwindcss.com/) for styling
- [shadcn/ui](https://ui.shadcn.com/) for components

## Portal Structure

| Portal | URL | Description |
|--------|-----|-------------|
| Main Site | `yourdomain.com` | Customer-facing marketplace |
| Admin | `admin-{hash}.yourdomain.com` | Platform administration |
| Seller | `seller.yourdomain.com` | Seller dashboard & registration |
| Stores | `{storename}.yourdomain.com` | Individual seller storefronts |

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- pnpm (recommended)
- Upstash Redis account

### Installation

1. Clone and install:

   ```bash
   git clone <repo-url>
   cd platforms-starter-kit
   pnpm install
   ```

2. Set up environment variables - copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

3. Configure your `.env.local`:

   ```env
   # Redis (Upstash)
   KV_REST_API_URL=your_redis_url
   KV_REST_API_TOKEN=your_redis_token
   
   # NextAuth.js (generate with: openssl rand -base64 32)
   AUTH_SECRET=your-auth-secret-min-32-characters
   AUTH_URL=http://localhost:3000
   
   # Admin Subdomain (pre-computed, default: admin-fe7b9bce29ac)
   ADMIN_SUBDOMAIN=admin-fe7b9bce29ac
   ADMIN_SECRET_KEY=marketplace-admin-2026
   
   # OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Domain
   NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
   ```

4. Start development server:

   ```bash
   pnpm dev
   ```

5. Access the application:
   - Main site: http://localhost:3000
   - Admin portal: http://admin-fe7b9bce29ac.localhost:3000
   - Seller portal: http://seller.localhost:3000

### Creating an Admin User

Make a POST request to create your first admin:

```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -H "x-admin-setup-key: marketplace-admin-2026" \
  -d '{"name": "Admin", "email": "admin@example.com", "password": "SecurePass123"}'
```

### Customizing Admin Subdomain

To use your own admin secret:

1. Generate the hash:
   ```bash
   echo -n "your-secret-key" | shasum -a 256 | cut -c1-12
   ```

2. Update `.env.local`:
   ```env
   ADMIN_SUBDOMAIN=admin-{your-12-char-hash}
   ADMIN_SECRET_KEY=your-secret-key
   ```

## Authentication Flow

### User Registration
- Users register at `/auth/register`
- OAuth available (Google/Apple)
- Email/password with validation

### Seller Registration
- Sellers register at `/auth/seller-register`
- Two-step process: Account → Business details
- Subdomain availability check
- Custom domain support for manufacturers

### Admin Access
- Secret subdomain prevents unauthorized access
- Full platform management capabilities
- Seller approval workflow

## Deployment on Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Configure domains:
   - Add root domain
   - Enable wildcard subdomain (`*.yourdomain.com`)

## Directory Structure

```
app/
├── api/
│   ├── auth/[...nextauth]/   # NextAuth API
│   ├── admin/setup/           # Admin creation endpoint
│   └── seller/               # Seller API routes
├── auth/
│   ├── login/                # Login page
│   ├── register/             # User registration
│   ├── seller-register/      # Seller registration
│   └── error/                # Auth error page
├── admin/                    # Admin dashboard
├── seller/                   # Seller dashboard
├── store/[subdomain]/        # Seller storefronts
└── page.tsx                  # Main marketplace
lib/
├── auth-config.ts            # Auth configuration
├── db.ts                     # Database operations
├── redis.ts                  # Redis client
├── types.ts                  # TypeScript types
└── utils.ts                  # Utilities
```

## License

MIT
