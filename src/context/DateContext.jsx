import { createContext, useContext, useState } from "react";

const DateContext = createContext(null);

export function DateProvider({ children }) {
  const today = new Date().toISOString().split("T")[0];

  const [startdate, setStartdate] = useState(today);
  const [enddate, setEnddate] = useState(today);

  return (
    <DateContext.Provider
      value={{
        startdate,
        enddate,
        setStartdate,
        setEnddate
      }}
    >
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  const ctx = useContext(DateContext);
  if (!ctx) {
    throw new Error("useDate must be used inside DateProvider");
  }
  return ctx;
}
