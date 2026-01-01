'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (user && role) {
      // User is logged in, redirect to appropriate dashboard
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'ops') {
        router.push('/ops/dashboard');
      }
    } else {
      // User not logged in, redirect to login
      router.push('/login');
    }
  }, [user, role, loading, router]);

  return null;
}
