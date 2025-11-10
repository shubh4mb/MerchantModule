// context/AuthContext.tsx
import  { createContext, useState, useEffect, useContext } from "react";
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
  login: (merchant: Merchant, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  merchant: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedMerchant = localStorage.getItem("merchant");
    if (savedToken && savedMerchant) {
      setToken(savedToken);
      setMerchant(JSON.parse(savedMerchant));
    }
  }, []);

  const login = (merchantData: Merchant, tokenData: string) => {
    setMerchant(merchantData);
    setToken(tokenData);
    localStorage.setItem("token", tokenData);
    localStorage.setItem("merchant", JSON.stringify(merchantData));
  };

  const logout = () => {
    setMerchant(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("merchant");
  };

  return (
    <AuthContext.Provider value={{ merchant, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
