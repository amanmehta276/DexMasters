// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [vault, setVault]     = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [branch, setBranch]   = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load persisted data on startup (replaces localStorage reads)
    (async () => {
      const u = await AsyncStorage.getItem('user');
      const t = await AsyncStorage.getItem('token');
      const v = await AsyncStorage.getItem('vault');
      if (u) setUser(JSON.parse(u));
      if (t) setToken(t);
      if (v) setVault(JSON.parse(v));
    })();
  }, []);

  const login = async (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('token', userToken);
  };

  const logout = async () => {
    setUser(null); setToken(null); setVault([]);
    await AsyncStorage.clear();
  };

  const addToVault = async (item) => {
    const updated = [item, ...vault.filter(v => v.url !== item.url)];
    setVault(updated);
    await AsyncStorage.setItem('vault', JSON.stringify(updated));
  };

  const removeFromVault = async (index) => {
    const updated = vault.filter((_, i) => i !== index);
    setVault(updated);
    await AsyncStorage.setItem('vault', JSON.stringify(updated));
  };

  return (
    <AppContext.Provider value={{
      user, token, vault, subjects, setSubjects,
      branch, setBranch, loading, setLoading,
      login, logout, addToVault, removeFromVault,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);