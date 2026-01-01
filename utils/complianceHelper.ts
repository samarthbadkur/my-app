/**
 * Calculate compliance status based on license expiry date
 * @param licenseExpiryDate - Date string in format 'YYYY-MM-DD'
 * @returns 'Compliant' | 'Expiring Soon' | 'Non-Compliant'
 */
export const calculateComplianceStatus = (licenseExpiryDate: string): 'Compliant' | 'Expiring Soon' | 'Non-Compliant' => {
  try {
    const expiryDate = new Date(licenseExpiryDate);
    const today = new Date();
    
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    // Check if license has expired
    if (expiryDate < today) {
      return 'Non-Compliant';
    }

    // Calculate days until expiry
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Check if expiry is within 30 days
    if (daysDiff <= 30) {
      return 'Expiring Soon';
    }

    return 'Compliant';
  } catch (err) {
    console.error('Error calculating compliance status:', err);
    return 'Non-Compliant';
  }
};

/**
 * Get color for compliance status
 */
export const getComplianceColor = (status: string): string => {
  switch (status) {
    case 'Compliant':
      return '#d4edda';
    case 'Expiring Soon':
      return '#fff3cd';
    case 'Non-Compliant':
      return '#f8d7da';
    default:
      return '#fff';
  }
};
