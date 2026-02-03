import { BrowserRouter, Routes, Route } from "react-router-dom";
import Components from "./components/Components";
import Login from "./components/Login";
import ProtectedRoute from "./components/Protectedroute";
import Settings from "./components/Settings";

function App() {
  return (
    <BrowserRouter >
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
    </BrowserRouter>
  );
}

export default App;