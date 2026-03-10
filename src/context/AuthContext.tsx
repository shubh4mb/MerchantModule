// context/AuthContext.tsx
import { createContext, useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";

interface Merchant {
  id: string;
  shopName: string;
  email: string;
  phoneNumber: string;
}

interface AuthContextType {
  merchant: Merchant | null;
  token: string | null;
  isLoading: boolean;
  login: (merchant: Merchant, token: string) => void;
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
    const checkAuth = () => {
      try {
        const savedToken = localStorage.getItem("token");
        const savedMerchant = localStorage.getItem("merchant");
        if (savedToken && savedMerchant) {
          setToken(savedToken);
          setMerchant(JSON.parse(savedMerchant));
        }
      } catch (error) {
        console.error("Failed to parse merchant data from localStorage", error);
        localStorage.removeItem("token");
        localStorage.removeItem("merchant");
        localStorage.removeItem("merchant_id");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (merchantData: Merchant, tokenData: string) => {
    setMerchant(merchantData);
    setToken(tokenData);
    localStorage.setItem("token", tokenData);
    localStorage.setItem("merchant", JSON.stringify(merchantData));
    localStorage.setItem("merchant_id", merchantData.id); // Backward compatibility
  };

  const logout = () => {
    setMerchant(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("merchant");
    localStorage.removeItem("merchant_id"); // Backward compatibility
    window.location.href = "/merchant/login";
  };

  return (
    <AuthContext.Provider value={{ merchant, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


