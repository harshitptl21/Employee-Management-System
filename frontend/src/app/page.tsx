'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isPrivilegedRole } from '@/lib/utils';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace(isPrivilegedRole(user.role) ? '/dashboard' : `/employees/${user.sub}`);
  }, [isLoading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-canvas-dark">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}
