"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "client";
  avatarUrl?: string; // <-- On ajoute l'URL de la photo de profil ici !
} | null;

type UserContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur du localStorage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null); // Ajouté : force user à null si rien n'est stocké
    }
    setIsLoading(false);
  }, []);

  // Sauvegarder l'utilisateur dans le localStorage à chaque changement
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}