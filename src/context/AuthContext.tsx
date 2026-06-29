import { createContext, useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";
import axiosInstance, { authEvents } from "../utils/axiosInstance";

interface Merchant {
  id: string;
  shopName: string;
  email: string;
  phoneNumber: string;
  isActive?: boolean;
  status?: string;
  zoneId?: string;
  rejectionReason?: string;
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
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = localStorage.getItem("token");
        const savedMerchant = localStorage.getItem("merchant");

        if (savedToken && savedMerchant) {
          setToken(savedToken);
          setMerchant(JSON.parse(savedMerchant));
        } else {
          // Silent Refresh: Try to recover session using stored refreshToken or cookie
          try {
            const storedRefreshToken = localStorage.getItem("refreshToken");
            const res = await axiosInstance.post('/merchant/auth/refresh', {
              refreshToken: storedRefreshToken
            });
            if (res.data?.token && res.data?.merchant) {
              login(res.data.merchant, res.data.token, res.data.refreshToken);
            }
          } catch (err) {
            // No valid session
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
    setMerchant(merchantData);
    setToken(tokenData);
    localStorage.setItem("token", tokenData);
    localStorage.setItem("merchant", JSON.stringify(merchantData));
    localStorage.setItem("merchant_id", merchantData.id);
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



