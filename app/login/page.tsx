'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebase.config';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      console.log(`✅ User logged in: ${user.email}, Role: ${role}`);
      
      if (role === 'admin') {
        console.log('📍 Redirecting admin to /admin/dashboard');
        router.push('/admin/dashboard');
      } else if (role === 'ops') {
        console.log('📍 Redirecting ops to /ops/dashboard');
        router.push('/ops/dashboard');
      }
    }
  }, [user, role, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log(`🔐 Attempting login for: ${email}`);
      
      await signInWithEmailAndPassword(auth, email, password);
      
      console.log('✅ Firebase authentication successful');
      console.log('⏳ Waiting for auth listener to fetch role...');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      console.error('❌ Login error:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Role-Based Login</h1>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '5px' }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '8px', 
              marginTop: '5px', 
              boxSizing: 'border-box',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '8px', 
              marginTop: '5px', 
              boxSizing: 'border-box',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Logging in...' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px', border: '1px solid #b3e5fc' }}>
        <p><strong>📝 Test Accounts:</strong></p>
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px', marginBottom: '10px' }}>
          <p style={{ margin: '5px 0' }}><strong>Admin Account:</strong></p>
          <p style={{ margin: '5px 0', fontFamily: 'monospace' }}>Email: admin@test.com</p>
          <p style={{ margin: '5px 0', fontFamily: 'monospace' }}>Password: password123</p>
          <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>✅ Full access to all features</p>
        </div>
        <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
          <p style={{ margin: '5px 0' }}><strong>Ops Account:</strong></p>
          <p style={{ margin: '5px 0', fontFamily: 'monospace' }}>Email: ops@test.com</p>
          <p style={{ margin: '5px 0', fontFamily: 'monospace' }}>Password: password123</p>
          <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>📋 Read-only access only</p>
        </div>
      </div>
    </div>
  );
}
