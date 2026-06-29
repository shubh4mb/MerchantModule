import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface OrderItem {
  _id: string;
  name: string;
  size: string;
  image: string;
  quantity: number;
}

interface PackingPhoto {
  _id: string;
  url: string;
  itemId: string;
  uploadedAt: string;
}

export default function MobileUploadProof() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [orderStatus, setOrderStatus] = useState('');
  const [item, setItem] = useState<OrderItem | null>(null);
  const [photos, setPhotos] = useState<PackingPhoto[]>([]);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const orderId = queryParams.get('orderId') || '';
  const itemId = queryParams.get('itemId') || '';

  // Get base URL for axios dynamically
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchOrderInfo = async () => {
    if (!orderId || !itemId) {
      setError('Invalid link. Missing Order ID or Item ID.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/merchant/order/packing-info/${orderId}`);
      const { items, packingPhotos, orderStatus } = response.data;

      setOrderStatus(orderStatus);
      
      const foundItem = items.find((i: OrderItem) => i._id === itemId);
      if (!foundItem) {
        setError('Requested item not found in this order.');
      } else {
        setItem(foundItem);
      }

      // Filter photos belonging to this specific item
      const itemPhotos = (packingPhotos || []).filter((p: PackingPhoto) => p.itemId === itemId);
      setPhotos(itemPhotos);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch order information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderInfo();
  }, [orderId, itemId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size should be less than 10MB.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('orderId', orderId);
    formData.append('itemId', itemId);

    try {
      const response = await axios.post(`${API_URL}/merchant/order/packing-photos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadSuccess(true);
      // Refresh photo list
      if (response.data.photo) {
        setPhotos(prev => [...prev, response.data.photo]);
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.response?.data?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
        <Loader2 className="spinner" style={{ color: '#000000', width: '36px', height: '36px' }} />
        <p style={{ marginTop: '12px', fontSize: '14px', color: '#6B6B6B', fontWeight: 500 }}>Loading item details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
        <AlertCircle size={48} style={{ color: '#DC2626', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>Error</h3>
        <p style={{ fontSize: '14px', color: '#6B6B6B', maxWidth: '300px', lineHeight: 1.5 }}>{error}</p>
      </div>
    );
  }

  const isOrderClosed = ['packed', 'in_transit', 'try_phase', 'selection_made', 'completed', 'cancelled', 'rejected'].includes(orderStatus);

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'Inter, sans-serif', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Brand Header */}
        <div style={{ padding: '8px 0', textAlign: 'center', borderBottom: '1px solid #E8E8E8' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em' }}>FLASHFITS</h2>
          <p style={{ fontSize: '11px', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Order Packing Proof Uploader</p>
        </div>

        {/* Item Details Card */}
        {item && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            {item.image && (
              <img 
                src={item.image} 
                alt={item.name} 
                style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E8E8E8' }}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>{item.name}</h3>
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#6B6B6B' }}>
                <span>Size: <strong>{item.size}</strong></span>
                <span>•</span>
                <span>Qty: <strong>{item.quantity}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        {isOrderClosed ? (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <AlertCircle size={32} style={{ color: '#D97706', marginBottom: '8px' }} />
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#D97706' }}>Order Already Processed</h4>
            <p style={{ fontSize: '12px', color: '#B45309', marginTop: '4px' }}>
              This order has already been marked as packed or completed. No further photos can be uploaded.
            </p>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '12px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#6B6B6B' }}>
              Tap the button below to open your phone camera and take a packing photo of this item.
            </p>
            
            <label style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: '#000000', 
              color: '#FFFFFF', 
              padding: '14px 28px', 
              borderRadius: '24px', 
              fontSize: '14px', 
              fontWeight: 600, 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              pointerEvents: uploading ? 'none' : 'auto',
              opacity: uploading ? 0.7 : 1
            }}>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handlePhotoUpload} 
                style={{ display: 'none' }}
              />
              {uploading ? (
                <>
                  <Loader2 className="spinner spinner-sm" style={{ borderTopColor: '#FFFFFF' }} />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera size={18} />
                  Open Camera & Capture
                </>
              )}
            </label>

            {uploadSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '12px', fontWeight: 500, justifyContent: 'center' }}>
                <CheckCircle2 size={16} /> Photo uploaded successfully!
              </div>
            )}

            {uploadError && (
              <div style={{ color: '#DC2626', fontSize: '12px', fontWeight: 500 }}>
                {uploadError}
              </div>
            )}
          </div>
        )}

        {/* Gallery / History */}
        {photos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Uploaded Proofs ({photos.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {photos.map((p, idx) => (
                <div key={idx} style={{ position: 'relative', paddingBottom: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E8E8E8' }}>
                  <img 
                    src={p.url} 
                    alt={`Proof ${idx + 1}`} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 4, 
                    right: 4, 
                    background: 'rgba(0,0,0,0.6)', 
                    color: '#FFFFFF', 
                    fontSize: '9px', 
                    padding: '2px 6px', 
                    borderRadius: '4px' 
                  }}>
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Guidance */}
        {!isOrderClosed && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', padding: '16px 0', borderTop: '1px solid #E8E8E8', marginTop: '16px' }}>
            <p style={{ fontSize: '11px', color: '#9E9E9E', textAlign: 'center' }}>
              Photos will show up on your desktop computer screen instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
