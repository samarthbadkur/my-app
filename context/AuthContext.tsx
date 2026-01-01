'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebase/firebase.config';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'ops';

interface AuthUser extends FirebaseUser {
    role?: UserRole;
}

interface AuthContextType {
    user: AuthUser | null;
    role: UserRole | null;
    loading: boolean;
    error: string | null;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    error: null,
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only run on client side and ensure local copies of auth/db are defined
        const localAuth = auth;
        const localDb = db;

        if (typeof window === 'undefined' || !localAuth || !localDb) {
            setLoading(false);
            return;
        }

        try {
            const unsubscribe = onAuthStateChanged(localAuth, async (firebaseUser) => {
                try {
                    if (firebaseUser) {
                        // Get user role from Firestore
                        const userDoc = await getDoc(doc(localDb, 'users', firebaseUser.uid));
                        const userRole = userDoc.data()?.role as UserRole;

                        setUser({ ...firebaseUser, role: userRole });
                        setRole(userRole);
                    } else {
                        setUser(null);
                        setRole(null);
                    }
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Auth error');
                } finally {
                    setLoading(false);
                }
            });

            return () => unsubscribe();
        } catch (err) {
            console.error('Auth listener setup error:', err);
            setError(err instanceof Error ? err.message : 'Failed to setup auth listener');
            setLoading(false);
        }
    }, []);

    const logout = async () => {
        try {
            if (!auth) throw new Error('Auth not initialized');
            await auth.signOut();
            setUser(null);
            setRole(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Logout failed');
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, error, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }
    return context;
};
