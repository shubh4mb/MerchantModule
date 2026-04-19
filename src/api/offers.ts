import axiosInstance from '../utils/axiosInstance';

export interface OfferFormData {
  title: string;
  description?: string;
  badgeText?: string;
  type: 'VENDOR_DISCOUNT' | 'VENDOR_MIN_ORDER' | 'VENDOR_CLEARANCE';
  discountType: 'flat' | 'percentage';
  discountValue: number;
  maxDiscount?: number;
  conditions?: {
    minCartValue?: number;
    minOrderValue?: number;
    categoryIds?: string[];
    genders?: string[];
  };
  startDate: string;
  endDate: string;
  couponCode?: string;
  requiresCoupon?: boolean;
  maxUsageTotal?: number;
  maxUsagePerUser?: number;
  freeDelivery?: boolean;
  priority?: number;
  benefitType?: 'PRODUCT' | 'CART' | 'DELIVERY';
  stackable?: boolean;
  isExclusive?: boolean;
}

export interface Offer extends OfferFormData {
  _id: string;
  scope: string;
  merchantId: string;
  isActive: boolean;
  currentUsage: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all offers for the current merchant.
 */
export const getMyOffers = async (isActive?: boolean): Promise<Offer[]> => {
  try {
    const params: any = {};
    if (isActive !== undefined) params.isActive = isActive;
    const res = await axiosInstance.get('/merchant/offers', { params });
    return res.data?.offers || [];
  } catch (error) {
    console.error('Get offers error:', error);
    throw error;
  }
};

/**
 * Create a new offer.
 */
export const createOffer = async (data: OfferFormData): Promise<Offer> => {
  try {
    const res = await axiosInstance.post('/merchant/offers', data);
    return res.data?.offer;
  } catch (error) {
    console.error('Create offer error:', error);
    throw error;
  }
};

/**
 * Update an existing offer.
 */
export const updateOffer = async (id: string, data: Partial<OfferFormData>): Promise<Offer> => {
  try {
    const res = await axiosInstance.put(`/merchant/offers/${id}`, data);
    return res.data?.offer;
  } catch (error) {
    console.error('Update offer error:', error);
    throw error;
  }
};

/**
 * Toggle offer active status.
 */
export const toggleOffer = async (id: string): Promise<Offer> => {
  try {
    const res = await axiosInstance.patch(`/merchant/offers/${id}/toggle`);
    return res.data?.offer;
  } catch (error) {
    console.error('Toggle offer error:', error);
    throw error;
  }
};

/**
 * Delete an offer.
 */
export const deleteOffer = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/merchant/offers/${id}`);
  } catch (error) {
    console.error('Delete offer error:', error);
    throw error;
  }
};
