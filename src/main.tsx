import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.tsx'
import { AuthProvider } from "./context/AuthContext.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
     <AuthProvider>
      <GoogleOAuthProvider clientId="38756562066-okgjrlcfekdntca9af6cps7bgknc0dhr.apps.googleusercontent.com">
       <App />
     </GoogleOAuthProvider>
     </AuthProvider>
  </StrictMode>,
)
