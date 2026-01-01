'use client';

import { useAuth } from '@/hooks/useAuth';
import { useStaffCompliance } from '@/hooks/useStaffCompliance';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { calculateComplianceStatus, getComplianceColor } from '@/utils/complianceHelper';

export default function OpsDashboard() {
    const { user } = useAuth();
    const { staff, loading, error } = useStaffCompliance();
    const [routes, setRoutes] = useState<any[]>([]);
    const [routesLoading, setRoutesLoading] = useState(true);

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                setRoutesLoading(true);
                if (!db) {
                    console.warn('Firestore not initialized; skipping routes fetch');
                    setRoutes([]);
                    return;
                }
                const q = query(collection(db, 'routes'), orderBy('routeName'));
                const snap = await getDocs(q);
                setRoutes(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
            } catch (err) {
                console.error('Error fetching routes for ops:', err);
            } finally {
                setRoutesLoading(false);
            }
        };

        fetchRoutes();
    }, []);

    if (loading || routesLoading) {
        return <div style={{ padding: '20px' }}>⏳ Loading...</div>;
    }

    return (
        <div>
            <h1>Staff Compliance</h1>

            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#fff3cd',
                borderRadius: '5px',
                border: '1px solid #ffc107',
                marginBottom: '20px'
            }}>
                <p>📋 <strong>Read-Only Access:</strong> You can view compliance records and routes but cannot create, edit, delete, or approve.</p>
            </div>

            {error && (
                <div style={{
                    padding: '10px',
                    marginBottom: '15px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '4px',
                    border: '1px solid #f5c6cb'
                }}>
                    ⚠️ {error}
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <h2>Staff Compliance Records (Read-Only)</h2>
                {staff.length === 0 ? (
                    <p>No staff records found.</p>
                ) : (
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginTop: '15px'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Staff Name</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>DBS Expiry</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>License Expiry</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Compliance Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map(member => {
                                const dynamicStatus = calculateComplianceStatus(member.licenseExpiryDate);
                                return (
                                    <tr key={member.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '12px' }}>{member.staffName}</td>
                                        <td style={{ padding: '12px' }}>{member.role}</td>
                                        <td style={{ padding: '12px' }}>{member.dbsExpiryDate}</td>
                                        <td style={{ padding: '12px' }}>{member.licenseExpiryDate}</td>
                                        <td style={{
                                            padding: '12px',
                                            backgroundColor: getComplianceColor(dynamicStatus),
                                            borderRadius: '4px',
                                            fontWeight: 'bold'
                                        }}>
                                            {dynamicStatus}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ marginTop: '30px' }}>
                <h2>Routes (Read-Only)</h2>
                {routes.length === 0 ? (
                    <p>No routes found.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                        {routes.map((r) => {
                            const s = staff.find(st => st.id === r.staffId);
                            const needsComplianceCheck = r.plannedJourneyMinutes > 45;
                            const dynamicStaffStatus = s ? calculateComplianceStatus(s.licenseExpiryDate) : null;
                            const compliant = dynamicStaffStatus === 'Compliant';
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
                                    <p style={{ margin: '6px 0', fontWeight: 600 }}>
                                        Status: {r.approved ? 'Approved' : 'Pending'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
