"use client";

import { createContext, useContext, useState } from "react";

type Profile = { name: string; userId?: string } | null;

type CurrentProfileValue = {
  profile: Profile;
  setProfile: (profile: Profile) => void;
};

const CurrentProfileContext = createContext<CurrentProfileValue | null>(null);

export function CurrentProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<Profile>(null);

  return (
    <CurrentProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </CurrentProfileContext.Provider>
  );
}

export function useCurrentProfile() {
  const context = useContext(CurrentProfileContext);
  if (!context) {
    throw new Error(
      "useCurrentProfile doit être utilisé dans un CurrentProfileProvider.",
    );
  }
  return context;
}
