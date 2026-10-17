import { createContext, useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import axiosInstance, { authEvents } from "../utils/axiosInstance";

interface Merchant {
  id: string;
  _id?: string;
  shopName: string;
  email: string;
  phoneNumber: string;
  isActive?: boolean;
  status?: string;
  zoneId?: string;
  rejectionReason?: string;
  accountType?: 'merchant' | 'warehouse';
  warehouseId?: string;
}

interface AuthContextType {
  merchant: Merchant | null;
  token: string | null;
  isLoading: boolean;
  login: (merchant: Merchant, token: string, refreshToken?: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  merchant: null,
  token: null,
  isLoading: true,
  login: () => { },
  logout: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });
  const [merchant, setMerchant] = useState<Merchant | null>(() => {
    try {
      const saved = localStorage.getItem("merchant");
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && !parsed.id && parsed._id) {
        parsed.id = parsed._id;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const savedToken = localStorage.getItem("token");
    const savedMerchant = localStorage.getItem("merchant");
    return !(savedToken && savedMerchant);
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = localStorage.getItem("token");
        const savedMerchant = localStorage.getItem("merchant");
        const storedRefreshToken = localStorage.getItem("refreshToken");

        let hasValidSession = false;

        if (savedToken && savedMerchant) {
          try {
            const decoded = jwtDecode<{ exp?: number }>(savedToken);
            // If token has expiry and is expired (with 30s grace buffer), mark as invalid
            if (decoded?.exp && decoded.exp * 1000 < Date.now() + 30000) {
              hasValidSession = false;
            } else {
              setToken(savedToken);
              setMerchant(JSON.parse(savedMerchant));
              hasValidSession = true;
            }
          } catch {
            // Non-JWT or decode error fallback: assume session is valid until an API returns 401
            setToken(savedToken);
            setMerchant(JSON.parse(savedMerchant));
            hasValidSession = true;
          }
        }

        // Only attempt silent refresh if we don't have an active session and a refresh token actually exists
        if (!hasValidSession && storedRefreshToken && storedRefreshToken.trim() !== '') {
          try {
            const res = await axiosInstance.post('/merchant/auth/refresh', {
              refreshToken: storedRefreshToken
            });
            const data = res.data?.data || res.data;
            if (data?.token && data?.merchant) {
              login(data.merchant, data.token, data.refreshToken || storedRefreshToken);
            } else {
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("token");
              localStorage.removeItem("merchant");
              localStorage.removeItem("merchant_id");
            }
          } catch {
            // Refresh token expired, revoked, or invalid — clear stale auth data
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("token");
            localStorage.removeItem("merchant");
            localStorage.removeItem("merchant_id");
          }
        }
      } catch (error) {
        console.error("Failed to parse merchant data from localStorage", error);
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Sync state when token is refreshed by axios interceptor
    const onRefreshed = (data: { token: string; merchant: any }) => {
      setToken(data.token);
      if (data.merchant) setMerchant(data.merchant);
    };

    const onLogout = () => {
      setMerchant(null);
      setToken(null);
    };

    authEvents.on('auth:refreshed', onRefreshed);
    authEvents.on('auth:logout', onLogout);

    return () => {
      authEvents.off('auth:refreshed', onRefreshed);
      authEvents.off('auth:logout', onLogout);
    };
  }, []);

  const login = (merchantData: Merchant, tokenData: string, refreshTokenData?: string) => {
    const normalizedMerchant: Merchant = {
      ...merchantData,
      id: merchantData.id || merchantData._id || ""
    };
    setMerchant(normalizedMerchant);
    setToken(tokenData);
    localStorage.setItem("token", tokenData);
    localStorage.setItem("merchant", JSON.stringify(normalizedMerchant));
    localStorage.setItem("merchant_id", normalizedMerchant.id);
    if (refreshTokenData) {
      localStorage.setItem("refreshToken", refreshTokenData);
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/merchant/auth/logout');
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setMerchant(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("merchant");
      localStorage.removeItem("merchant_id");
      localStorage.removeItem("refreshToken");
      window.location.href = "/merchant/login";
    }
  };

  return (
    <AuthContext.Provider value={{ merchant, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

/**
 * Convenience hook — returns true when the logged-in account is a warehouse operator.
 */
export const useIsWarehouse = () => {
  const { merchant } = useAuth();
  return merchant?.accountType === 'warehouse';
};
