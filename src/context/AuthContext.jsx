import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [scno, setScno] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedScno = localStorage.getItem("scno");

    if (storedToken) setToken(storedToken);
    if (storedScno) setScno(storedScno);
  }, []);

  const login = ({ token, scno }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("scno", scno);
    setToken(token);
    setScno(scno);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setScno(null);
  };

  return (
    <AuthContext.Provider value={{ token, scno, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
