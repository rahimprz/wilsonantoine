import { createContext, useContext } from "react";

/** Who is signed in to the dashboard, when it runs on the database (null in browser-only mode). */
export interface Account {
  email: string;
  signOut: () => Promise<void>;
  /** Saves pending changes, then reloads everything from the database. */
  refresh: () => Promise<void>;
  setPassword: (password: string) => Promise<string | null>;
  databaseHost: string;
}

export const AccountContext = createContext<Account | null>(null);

export const useAccount = () => useContext(AccountContext);
