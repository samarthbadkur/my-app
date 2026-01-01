'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute requiredRole="admin">
      <div style={{ display: 'flex', height: '100%' }}>
        <aside style={{ width: '250px', borderRight: '1px solid #ccc', padding: '20px', overflowY: 'auto' }}>
          <h2>Admin Panel</h2>
          <p>Welcome, {user?.email}</p>
          <nav style={{ marginTop: '20px' }}>
            <Link href="/admin/dashboard" style={{ display: 'block', marginBottom: '10px' }}>
              Staff Compliance
            </Link>
            <Link href="/admin/data" style={{ display: 'block', marginBottom: '10px' }}>
              Routes Planning
            </Link>
          </nav>
          <button
            onClick={logout}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '5px',
            }}
          >
            Logout
          </button>
        </aside>
        <main style={{ flex: 1, padding: '20px', overflowY: 'auto', height: '100%' }}>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
