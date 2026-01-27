'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is a problem with the server configuration. Please contact support.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to access this resource.',
  },
  Verification: {
    title: 'Verification Error',
    description: 'The verification link may have expired or already been used.',
  },
  OAuthSignin: {
    title: 'OAuth Sign In Error',
    description: 'Error occurred while trying to sign in with OAuth provider.',
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'Error occurred during OAuth callback. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    description: 'Could not create an account using OAuth. Please try a different method.',
  },
  EmailCreateAccount: {
    title: 'Account Creation Error',
    description: 'Could not create an account with this email. Please try again.',
  },
  Callback: {
    title: 'Callback Error',
    description: 'An error occurred during authentication callback.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description: 'This email is already associated with another account. Please sign in with your original method.',
  },
  EmailSignin: {
    title: 'Email Sign In Error',
    description: 'The email could not be sent. Please try again.',
  },
  CredentialsSignin: {
    title: 'Sign In Failed',
    description: 'Invalid email or password. Please check your credentials and try again.',
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'Please sign in to access this page.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred. Please try again.',
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { title, description } = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/auth/login" className="block">
          <Button className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold">
            Try Again
          </Button>
        </Link>
        <Link href="/" className="block">
          <Button variant="outline" className="w-full h-12">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ErrorLoading() {
  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Loading...
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col">
      {/* Header */}
      <header className="w-full py-4 px-6 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Supply Me
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<ErrorLoading />}>
          <ErrorContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          © 2026 Supply Me. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
