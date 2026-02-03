import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function Protectedroute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("http://localhost:4000/me", {
      credentials: "include", 
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then(() => {
        setAuthenticated(true);
        setLoading(false);
      })
      .catch(() => {
        setAuthenticated(false);
        setLoading(false);
      });
  }, []);

  if (loading) return null; 

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default Protectedroute;
