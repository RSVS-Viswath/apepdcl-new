import { createContext, useContext, useState } from "react";

const DateContext = createContext(null);

export function DateProvider({ children }) {
  const defaultDate = "2025-12-30";

  const [startdate, setStartdate] = useState(defaultDate);
  const [enddate, setEnddate] = useState(defaultDate);

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
