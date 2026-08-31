import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { initializeAuth } from "./store/authSlice";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Layout from "./components/Layout";
import AdminView from "./components/AdminView";
import UserView from "./components/UserView";

function ProtectedRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const reduxUser = useSelector((state) => state.auth.user);

  const token = localStorage.getItem("token");
  const localUser = JSON.parse(localStorage.getItem("user"));

  const isAuth = isAuthenticated || !!token;
  const user = reduxUser || localUser;

  if (!isAuth || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout user={user} />;
}

export default function App() {
  const dispatch = useDispatch();
  const authReady = useSelector((state) => state.auth.initialized);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  if (!authReady) {
    return null;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes wrapped in Layout */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <div className="text-white text-2xl font-bold">
                Admin Dashboard
              </div>
            }
          />
          <Route path="/admin-tasks" element={<AdminView />} />
          <Route path="/my-tasks" element={<UserView />} />
          <Route path="/assigned-tasks" element={<UserView />} />
          <Route path="/home" element={<Home />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
