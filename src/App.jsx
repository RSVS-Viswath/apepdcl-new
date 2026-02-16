import { BrowserRouter, Routes, Route } from "react-router-dom";
import Components from "./components/Components";
import Login from "./components/Login";
import Settings from "./components/Settings";
import { DateProvider } from "./context/DateContext";
import Analytics from "./components/Analytics";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter >
     <AuthProvider>
      <DateProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
           <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <Components />
              </div>
           </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
          <ProtectedRoute>
            <>
                <Components />
                <Settings />
              </>
          </ProtectedRoute>
          }
        />
      </Routes>
      </DateProvider>
    </AuthProvider>  
    </BrowserRouter>
  );
}

export default App;
