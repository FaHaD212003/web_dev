import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Import your new components
import Layout from "./components/Layout";
import AdminView from "./components/AdminView";
import UserView from "./components/UserView";

function App() {
  // Retrieve the logged-in user's data from localStorage to pass to the Layout
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route element={user ? <Layout user={user} /> : <Navigate to="/login" replace />}>
          {/* Admin Routes */}
          <Route path="/dashboard" element={<div>Dashboard (Coming Soon)</div>} />
          <Route path="/admin-tasks" element={<AdminView />} />

          {/* User Routes */}
          <Route path="/my-tasks" element={<UserView />} />
          <Route path="/assigned-tasks" element={<div>Assigned Tasks (Coming Soon)</div>} />
          
          {/* Fallback Home Route inside Layout */}
          <Route path="/home" element={<Home />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;