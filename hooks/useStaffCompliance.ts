'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

export interface StaffCompliance {
  id: string;
  staffName: string;
  role: string;
  dbsExpiryDate: string;
  licenseExpiryDate: string;
  complianceStatus: 'Compliant' | 'Non-Compliant' | 'Expiring Soon';
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export const useStaffCompliance = () => {
  const [staff, setStaff] = useState<StaffCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all staff compliance records
  const fetchStaff = async () => {
    try {
      setLoading(true);
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      const q = query(collection(db, 'staff_compliance'), orderBy('staffName'));
      const snapshot = await getDocs(q);
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as StaffCompliance[];
      setStaff(staffData);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  // Add new staff record
  const addStaff = async (staffData: Omit<StaffCompliance, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'| 'complianceStatus'>) => {
    try {
      if (!db) throw new Error('Firestore not initialized');
      const docRef = await addDoc(collection(db, 'staff_compliance'), {
        ...staffData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ Staff added:', docRef.id);
      await fetchStaff();
      return docRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add staff';
      console.error('❌ Error adding staff:', errorMessage);
      throw err;
    }
  };

  // Update staff record
  const updateStaff = async (staffId: string, staffData: Partial<StaffCompliance>) => {
    try {
      if (!db) throw new Error('Firestore not initialized');
      const docRef = doc(db, 'staff_compliance', staffId);
      await updateDoc(docRef, {
        ...staffData,
        updatedAt: new Date(),
      });
      console.log('✅ Staff updated:', staffId);
      await fetchStaff();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff';
      console.error('❌ Error updating staff:', errorMessage);
      throw err;
    }
  };

  // Delete staff record
  const deleteStaff = async (staffId: string) => {
    try {
      if (!db) throw new Error('Firestore not initialized');
      await deleteDoc(doc(db, 'staff_compliance', staffId));
      console.log('✅ Staff deleted:', staffId);
      await fetchStaff();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete staff';
      console.error('❌ Error deleting staff:', errorMessage);
      throw err;
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchStaff();
  }, []);

  return {
    staff,
    loading,
    error,
    fetchStaff,
    addStaff,
    updateStaff,
    deleteStaff,
  };
};
