import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import Credentials from 'next-auth/providers/credentials';
import { UserRole } from '@/lib/auth-config';
import { 
  createUser, 
  getUserByEmail, 
  getUserByProvider, 
  verifyUserPassword,
  linkProviderToUser 
} from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Apple OAuth
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),

    // Email/Password credentials
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await verifyUserPassword(email, password);
        
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // For OAuth providers, check if user exists or create new one
      if (account?.provider && account.provider !== 'credentials') {
        const existingUser = await getUserByProvider(account.provider, user.email);
        
        if (existingUser) {
          // User exists with this provider
          user.id = existingUser.id;
          (user as any).role = existingUser.role;
          return true;
        }

        // Check if user exists with email (different provider)
        const userByEmail = await getUserByEmail(user.email);
        
        if (userByEmail) {
          // Link this provider to existing user
          await linkProviderToUser(userByEmail.id, account.provider, user.email);
          user.id = userByEmail.id;
          (user as any).role = userByEmail.role;
          return true;
        }

        // Map provider name to our enum
        const providerType = account.provider.toUpperCase() as 'GOOGLE' | 'APPLE' | 'CREDENTIALS';

        // Create new user
        const newUser = await createUser({
          email: user.email,
          name: user.name || null,
          image: user.image || null,
          role: UserRole.USER,
          provider: providerType,
        });

        user.id = newUser.id;
        (user as any).role = newUser.role;
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || UserRole.USER;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.role = session.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    newUser: '/auth/new-user',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure cookies for cross-subdomain authentication
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-authjs.session-token' 
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Use root domain for cross-subdomain cookie sharing
        domain: process.env.NODE_ENV === 'production' 
          ? '.supplyme.asia' 
          : undefined,
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.callback-url'
        : 'authjs.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production'
          ? '.supplyme.asia'
          : undefined,
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.csrf-token'
        : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Use root domain for cross-subdomain CSRF token sharing
        domain: process.env.NODE_ENV === 'production'
          ? '.supplyme.asia'
          : undefined,
      },
    },
  },

  trustHost: true,
});
