import { createSlice } from "@reduxjs/toolkit";

const getStoredAuth = () => {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null, initialized: true };
  }

  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("user");

  if (!token || !rawUser) {
    return { isAuthenticated: false, user: null, initialized: true };
  }

  try {
    return {
      isAuthenticated: true,
      user: JSON.parse(rawUser),
      initialized: true,
    };
  } catch {
    return { isAuthenticated: false, user: null, initialized: true };
  }
};

const initialState = {
  ...getStoredAuth(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.initialized = true;
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.initialized = true;
    },
    initializeAuth: (state) => {
      const stored = getStoredAuth();
      state.isAuthenticated = stored.isAuthenticated;
      state.user = stored.user;
      state.initialized = true;
    },
  },
});

export const { loginSuccess, logoutSuccess, initializeAuth } =
  authSlice.actions;
export default authSlice.reducer;
