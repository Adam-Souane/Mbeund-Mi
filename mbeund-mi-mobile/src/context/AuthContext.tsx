import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';

function getApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (__DEV__ && debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8000/api`;
  }
  return 'https://mbeund-mi.onrender.com/api';
}

export const API_URL = getApiUrl();

export interface RegisterData {
  first_name: string;
  last_name: string;
  username: string;
  telephone: string;
  email?: string;
  password: string;
  canal_otp: 'telephone' | 'email';
}

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  verifyOtp: (username: string, otp: string) => Promise<void>;
  resendOtp: (username: string, canal: string) => Promise<{ canal: string; destination: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>('citoyen');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await SecureStore.getItemAsync('userName');
        const storedRole = await SecureStore.getItemAsync('userRole');
        if (storedToken) {
          setToken(storedToken);
          setUsername(storedUser || 'citoyen');
          setRole(storedRole || 'citoyen');
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (e) {
        console.error('Échec de la récupération du token:', e);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrapAsync();
  }, []);

  const login = async (userInput: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/token/`, { username: userInput, password });
      const newToken = response.data.access;
      const detectedUsername = response.data.username || userInput;
      const detectedRole = response.data.role || 'citoyen';
      
      await SecureStore.setItemAsync('userToken', newToken);
      await SecureStore.setItemAsync('userName', detectedUsername);
      await SecureStore.setItemAsync('userRole', detectedRole);

      if (response.data.refresh) {
        await SecureStore.setItemAsync('refreshToken', response.data.refresh);
      }
      setToken(newToken);
      setUsername(detectedUsername);
      setRole(detectedRole);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await axios.post(`${API_URL}/users/register/`, data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      throw error;
    }
  };

  const verifyOtp = async (userInput: string, otp: string) => {
    try {
      await axios.post(`${API_URL}/users/verify-otp/`, { username: userInput, otp });
    } catch (error) {
      console.error('Erreur lors de la vérification OTP:', error);
      throw error;
    }
  };

  const resendOtp = async (userInput: string, canal: string) => {
    try {
      const response = await axios.post(`${API_URL}/users/resend-otp/`, { username: userInput, canal });
      return response.data; // { canal, destination, detail }
    } catch (error) {
      console.error('Erreur lors du renvoi OTP:', error);
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userName');
    await SecureStore.deleteItemAsync('userRole');
    setToken(null);
    setUsername(null);
    setRole(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
        isLoading,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
  }
  return context;
}
