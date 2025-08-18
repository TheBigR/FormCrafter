import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface User {
  id: string;
  email: string;
  name: string;
}

export function useAuth(redirectTo?: string) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      // User is not authenticated, redirect to login
      const redirectPath = redirectTo ? `/login?redirect=${redirectTo}` : '/login';
      router.push(redirectPath);
    } else {
      setIsLoading(false);
    }
  }, [status, redirectTo, router]);

  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  } : null;

  return { user, isLoading };
}
