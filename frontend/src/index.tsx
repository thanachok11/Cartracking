import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";  // นำเข้า App ที่ทำการตั้งค่า React Router ไว้แล้ว
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <>
    <App />
  </>
);