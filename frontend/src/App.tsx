import axios from "axios";
import React, { useState } from "react";
import Header from "./components/layout/Header";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VehicleTimelinePage from "./pages/VehicleTimeline";
import MapView from "./pages/MapView";
import HomePage from "./pages/Homepage";

import "./App.css";

// ✅ Interceptor: หาก token หมดอายุ ให้ logout และ redirect
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/"; // เปลี่ยนหน้าแบบ force reload
    }
    return Promise.reject(error);
  }
);

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div
        className={`app-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"
          }`}
      >
        <Header
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/vehicle/:id/view" element={<VehicleTimelinePage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
