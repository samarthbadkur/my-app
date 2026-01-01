'use client';

import { useEffect, useState } from 'react';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';
import { useRole } from '@/hooks/useRole';
import { useStaffCompliance } from '@/hooks/useStaffCompliance';
import { calculateComplianceStatus, getComplianceColor } from '@/utils/complianceHelper';

interface RouteItem {
    id: string;
    routeName: string;
    plannedJourneyMinutes: number;
    staffId: string;
    approved?: boolean;
}

export default function DataPage() {
    const { isAdmin } = useRole();
    const { staff, fetchStaff } = useStaffCompliance();

    const [routes, setRoutes] = useState<RouteItem[]>([]);
    const [routeName, setRouteName] = useState('');
    const [plannedJourneyMinutes, setPlannedJourneyMinutes] = useState<string>('');
    const [staffId, setStaffId] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchRoutes();
        if (!staff.length) fetchStaff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchRoutes = async () => {
        try {
            const q = query(collection(db, 'routes'), orderBy('routeName'));
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as RouteItem[];
            setRoutes(items);
        } catch (err) {
            console.error('Error fetching routes:', err);
        }
    };

    const canApprove = (route: RouteItem) => {
        if (!isAdmin) return false;
        if (route.plannedJourneyMinutes <= 45) return true;
        const s = staff.find((st) => st.id === route.staffId);
        const dynamicStatus = s ? calculateComplianceStatus(s.licenseExpiryDate) : null;
        return dynamicStatus === 'Compliant';
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) return;
        try {
            setLoading(true);
            const minutes = Number(plannedJourneyMinutes);
            if (!plannedJourneyMinutes || isNaN(minutes)) {
                alert('Please enter a valid planned journey time in minutes');
                setLoading(false);
                return;
            }
            await addDoc(collection(db, 'routes'), {
                routeName,
                plannedJourneyMinutes: minutes,
                staffId,
                approved: false,
                createdAt: new Date(),
            });
            setRouteName('');
            setPlannedJourneyMinutes('');
            setStaffId('');
            await fetchRoutes();
            setShowForm(false);
        } catch (err) {
            console.error('Error adding route:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!isAdmin) return;
        try {
            await deleteDoc(doc(db, 'routes', id));
            await fetchRoutes();
        } catch (err) {
            console.error('Error deleting route:', err);
        }
    };

    const handleApprove = async (route: RouteItem) => {
        if (!canApprove(route)) return;
        try {
            const docRef = doc(db, 'routes', route.id);
            await updateDoc(docRef, { approved: true, approvedAt: new Date() });
            await fetchRoutes();
        } catch (err) {
            console.error('Error approving route:', err);
        }
    };

    return (
        <div>
            <h1>Route Planning</h1>

            {isAdmin && (
                <div style={{ marginBottom: '20px' }}>
                    {!showForm ? (
                        <button
                            onClick={() => setShowForm(true)}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#0d6efd',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            ➕ Add New Route
                        </button>
                    ) : (
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '6px',
                            border: '1px solid #ddd'
                        }}>
                            <h2 style={{ marginTop: 0 }}>Add New Route</h2>
                            <form onSubmit={handleAdd}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Route Name:</label>
                                    <input
                                        type="text"
                                        placeholder="Enter route name"
                                        value={routeName}
                                        onChange={(e) => setRouteName(e.target.value)}
                                        required
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            boxSizing: 'border-box',
                                            backgroundColor: '#fff'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Planned Journey Time (minutes):</label>
                                    <input
                                        type="number"
                                        min={0}
                                        placeholder="e.g., 30"
                                        value={plannedJourneyMinutes}
                                        onChange={(e) => setPlannedJourneyMinutes(e.target.value)}
                                        required
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            boxSizing: 'border-box',
                                            backgroundColor: '#fff'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Assign Staff:</label>
                                    <select
                                        value={staffId}
                                        onChange={(e) => setStaffId(e.target.value)}
                                        required
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            boxSizing: 'border-box',
                                            backgroundColor: '#fff'
                                        }}
                                    >
                                        <option value="">Select Staff</option>
                                        {staff.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.staffName} — {s.complianceStatus}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {loading ? 'Creating...' : 'Add Route'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRouteName('');
                                            setPlannedJourneyMinutes('');
                                            setStaffId('');
                                            setShowForm(false);
                                        }}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {routes.length === 0 ? (
                    <p>No routes found.</p>
                ) : (
                    routes.map((r) => {
                        const s = staff.find((st) => st.id === r.staffId);
                        const needsComplianceCheck = r.plannedJourneyMinutes > 45;
                        const dynamicStaffStatus = s ? calculateComplianceStatus(s.licenseExpiryDate) : null;
                        const compliant = dynamicStaffStatus === 'Compliant';
                        const approveEnabled = canApprove(r);
                        const complianceColor = s ? getComplianceColor(dynamicStaffStatus || 'Non-Compliant') : '#f0f0f0';

                        return (
                            <div key={r.id} style={{ border: '1px solid #e0e0e0', padding: '12px', borderRadius: '6px', background: '#fff' }}>
                                <h3 style={{ margin: 0 }}>{r.routeName}</h3>
                                <p style={{ margin: '6px 0' }}>
                                    <strong>Planned Journey:</strong> {r.plannedJourneyMinutes} minutes
                                </p>
                                <p style={{ margin: '6px 0' }}>
                                    <strong>Staff:</strong> {s ? s.staffName : 'Unassigned'}
                                </p>
                                <div style={{ margin: '6px 0' }}>
                                    <strong>Compliance Alert:</strong>
                                    <span style={{
                                        marginLeft: '8px',
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        backgroundColor: complianceColor,
                                        fontWeight: 600
                                    }}>
                                        {needsComplianceCheck ? (compliant ? 'Compliant' : 'Not Compliant') : 'Not Required'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <button
                                        onClick={() => handleApprove(r)}
                                        disabled={!approveEnabled || r.approved}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: r.approved ? '#6c757d' : approveEnabled ? '#28a745' : '#adb5bd',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: approveEnabled && !r.approved ? 'pointer' : 'not-allowed',
                                        }}
                                    >
                                        {r.approved ? 'Approved' : 'Approve'}
                                    </button>

                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDelete(r.id)}
                                            style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
