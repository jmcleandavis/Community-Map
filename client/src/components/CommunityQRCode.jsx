import React from 'react';

// This component generates a QR code for the community sales map
// It uses the free qrserver.com API (same as in GarageSalesAdmin)
// Props: communityId (required), communityName (optional), size (optional)

const CommunityQRCode = ({ communityId, communityName = '', size = 300 }) => {
  if (!communityId) return null;

  // Build the map URL using the environment variable
  let baseUrl = import.meta.env.VITE_COMMUNITYMAP_API_URL || window.location.origin;
  
  // Ensure the URL includes 'www' if it's not already there
  if (baseUrl.includes('://') && !baseUrl.includes('://www.')) {
    baseUrl = baseUrl.replace('://', '://www.');
  } else if (!baseUrl.includes('://')) {
    baseUrl = `https://www.${baseUrl}`;
  }
  
  const mapUrl = `${baseUrl}/?communityId=${communityId}`;

  // Use qrserver.com API to generate the QR code image
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(mapUrl)}`;

  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <h2 style={{ marginBottom: 16 }}>{communityName || 'Community Garage Sale'}</h2>
      <img
        src={qrCodeUrl}
        alt={`QR Code for ${communityName || 'Community Garage Sale'}`}
        width={size}
        height={size}
        style={{ borderRadius: 8, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', background: '#fff' }}
      />
      <div style={{ marginTop: 16, color: '#666', fontSize: 15 }}>
        Scan this code to access the community garage sales map on your device.
      </div>
    </div>
  );
};

export default CommunityQRCode;
