import axios from "axios";
import React, { useState } from "react";
import Header from "./components/layout/Header";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VehicleTimelinePage from "./pages/VehicleTimeline";
import MapView from "./pages/MapView";
import HomePage from "./pages/LandingPage";
import Sidebar from "./components/layout/Sidebar";
import { GoogleMapsProvider } from './pages/GoogleMapsProvider'; // ✅

import "./App.css";

// ✅ Interceptor: หาก token หมดอายุ ให้ logout และ redirect
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const token = localStorage.getItem("token");

  return (
    <Router>
      <GoogleMapsProvider> {/* ✅ ครอบ Provider ตรงนี้ */}
        <div
          className={`app-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        >
          {/* ✅ แสดง Header เฉพาะเมื่อยังไม่ได้ login */}
          {!token && (
            <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
          )}

          {/* ✅ แสดง Sidebar เฉพาะเมื่อ login แล้ว */}
          {token && (
            <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          )}

          <div className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/vehicle/:id/view" element={<VehicleTimelinePage />} />
            </Routes>
          </div>
        </div>
      </GoogleMapsProvider>
    </Router>
  );
};

export default App;
