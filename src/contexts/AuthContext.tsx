// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  cpf: string;
  fullname: string;
  email: string;
  photoURL?: string; // Adicionado photoURL
  telefone?: string;
  datanascimento?: string;
};

type AuthContextType = {
  user: User | null;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Ao iniciar app, tenta carregar o usuário salvo
    const loadUser = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('@piauitickets_user');
        if (userDataString) {
          setUser(JSON.parse(userDataString));
        }
      } catch (e) {
        console.error('Erro ao carregar usuário salvo', e);
      }
    };
    loadUser();
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    await AsyncStorage.setItem("@piauitickets_user", JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@piauitickets_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
