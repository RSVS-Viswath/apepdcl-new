import { BrowserRouter, Routes, Route } from "react-router-dom";
import Components from "./components/Components";
import Login from "./components/Login";
import Settings from "./components/Settings";
import { DateProvider } from "./context/DateContext";
import Analytics from "./components/Analytics";

function App() {
  return (
    <BrowserRouter >
      <DateProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-50">
                <Components />
              </div>
          }
        />

        <Route
          path="/analytics"
          element={
            <Analytics />
          }
        />

        <Route
          path="/settings"
          element={
            <>
                <Components />
                <Settings />
              </>
          }
        />
      </Routes>
      </DateProvider>  
    </BrowserRouter>
  );
}

export default App;