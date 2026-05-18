'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, databases, ID, Query } from '@/lib/appwrite';

const AuthContext = createContext<any>(null);

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const ensureUserExists = async (userId: string, email: string) => {
  try {
    const usersResponse = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'users',
      [Query.equal('userId', userId)]
    );
    
    if (usersResponse.documents.length === 0) {
      const referralCode = generateReferralCode();
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        ID.unique(),
        {
          userId,
          email,
          referredBy: null,
          referralCode,
          tierLevel: 0,
          totalReferralEarnings: 0,
          miningLevel: 'free_tier',
          currentHashrate: '1 TH/s',
          freeMiningEnabled: true
        }
      );
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      await ensureUserExists(currentUser.$id, currentUser.email);
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, referredBy?: string) => {
    try {
      const newUser = await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      
      const referralCode = generateReferralCode();
      
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        ID.unique(),
        {
          userId: newUser.$id,
          email,
          referredBy: referredBy || null,
          referralCode,
          tierLevel: 0,
          totalReferralEarnings: 0,
          miningLevel: 'free_tier',
          currentHashrate: '1 TH/s',
          freeMiningEnabled: true
        }
      );
      
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // First try to delete any existing session
      try {
        await account.deleteSession('current');
      } catch (e) {
        // Ignore error - no session to delete
      }
      
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      await ensureUserExists(currentUser.$id, currentUser.email);
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
