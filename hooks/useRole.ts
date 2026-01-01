'use client';

import { useAuth } from './useAuth';

export const useRole = () => {
  const { role } = useAuth();

  return {
    isAdmin: role === 'admin',
    isOps: role === 'ops',
    role,
  };
};
