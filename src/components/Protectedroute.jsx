import { Navigate } from "react-router-dom";

function Protectedroute({ children }) {
  const isAuth = localStorage.getItem("isAuthenticated") === "true";

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default Protectedroute;