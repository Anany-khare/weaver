import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/config/api";

// Helper function to set auth token in localStorage
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Get initial state from localStorage
const token = localStorage.getItem('authToken');
const user = localStorage.getItem('user');

// Set initial state
const initialState = {
  isAuthenticated: false, // Start as false, will be updated by checkAuth
  isLoading: true, // Start as true to show loading state
  user: null
};

// Set token in axios headers if it exists
if (token) {
  setAuthToken(token);
}

export const registerUser = createAsyncThunk(
  "/auth/register",
  async (formData) => {
    const response = await api.post(
      "/api/auth/register",
      formData,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

export const loginUser = createAsyncThunk(
  "/auth/login",
  async (formData) => {
    const response = await api.post("/api/auth/login", formData);
    if (response.data.token) {
      setAuthToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }
);

export const logoutUser = createAsyncThunk(
  "/auth/logout",
  async () => {
    await api.post("/api/auth/logout");
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  }
);

export const checkAuth = createAsyncThunk(
  "/auth/checkauth",
  async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { success: false };
    }

    try {
      const response = await api.get("/api/auth/check-auth");
      if (response.data.success) {
        // Update user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
    }
    return { success: false };
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.success;
        state.user = action.payload.user;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { updateUser } = authSlice.actions;
export default authSlice.reducer;
