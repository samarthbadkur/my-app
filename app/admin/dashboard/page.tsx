'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStaffCompliance, StaffCompliance } from '@/hooks/useStaffCompliance';
import { calculateComplianceStatus, getComplianceColor } from '@/utils/complianceHelper';

export default function AdminDashboard() {
    const { user } = useAuth();
    const { staff, loading, error, addStaff, updateStaff, deleteStaff } = useStaffCompliance();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        staffName: '',
        role: '',
        dbsExpiryDate: '',
        licenseExpiryDate: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Update existing
                await updateStaff(editingId, formData);
                setEditingId(null);
            } else {
                // Add new
                await addStaff(formData);
            }
            // Reset form
            setFormData({
                staffName: '',
                role: '',
                dbsExpiryDate: '',
                licenseExpiryDate: '',
            });
            setShowForm(false);
        } catch (err) {
            alert('Error saving staff: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleEdit = (staffMember: StaffCompliance) => {
        setFormData({
            staffName: staffMember.staffName,
            role: staffMember.role,
            dbsExpiryDate: staffMember.dbsExpiryDate,
            licenseExpiryDate: staffMember.licenseExpiryDate,
        });
        setEditingId(staffMember.id);
        setShowForm(true);
    };

    const handleDelete = async (staffId: string) => {
        if (confirm('Are you sure you want to delete this staff member?')) {
            try {
                await deleteStaff(staffId);
            } catch (err) {
                alert('Error deleting staff: ' + (err instanceof Error ? err.message : 'Unknown error'));
            }
        }
    };



    if (loading) {
        return <div style={{ padding: '20px' }}>⏳ Loading...</div>;
    }

    return (
        <div>
            <h1>Staff Compliance</h1>

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

            {showForm && (
                <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                }}>
                    <h2>{editingId ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Staff Name:</label>
                            <input
                                type="text"
                                name="staffName"
                                value={formData.staffName}
                                onChange={handleInputChange}
                                required
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
                            <label>Role:</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                required
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '8px',
                                    marginTop: '5px',
                                    boxSizing: 'border-box',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            >
                                <option value="">Select Role</option>
                                <option value="Admin">Admin</option>
                                <option value="Operations">Operations</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>DBS Expiry Date:</label>
                            <input
                                type="date"
                                name="dbsExpiryDate"
                                value={formData.dbsExpiryDate}
                                onChange={handleInputChange}
                                required
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
                            <label>License Expiry Date:</label>
                            <input
                                type="date"
                                name="licenseExpiryDate"
                                value={formData.licenseExpiryDate}
                                onChange={handleInputChange}
                                required
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



                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="submit"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {editingId ? 'Update' : 'Add'} Staff Member
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                    setFormData({
                                        staffName: '',
                                        role: '',
                                        dbsExpiryDate: '',
                                        licenseExpiryDate: '',
                                    });
                                }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        marginBottom: '20px',
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    ➕ Add New Staff Member
                </button>
            )}

            <div style={{ overflowX: 'auto' }}>
                <h2>Staff Compliance Records</h2>
                {staff.length === 0 ? (
                    <p>No staff records found. Add one to get started!</p>
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
                                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
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
                                    <td style={{ padding: '12px' }}>
                                        <button
                                            onClick={() => handleEdit(member)}
                                            style={{
                                                marginRight: '10px',
                                                padding: '5px 10px',
                                                backgroundColor: '#ffc107',
                                                color: 'black',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
