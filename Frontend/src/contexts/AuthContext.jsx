import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { getApiErrorMessage } from "../lib/apiError";
const API_URL = import.meta.env.VITE_API_URL;
let refreshRequest = null;

const normalizeUser = (user = {}) => {
  const rawJoinDate = user.joinDate || user.startDate;
  return {
    ...user,
    id: user.id || user._id || user._doc?._id,
    joinDate: rawJoinDate
      ? new Date(rawJoinDate).toISOString().split("T")[0]
      : user.joinDate || "",
    avatar:
      user.avatar ||
      user.profileImage ||
      (user.name
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`
        : undefined),
  };
};

const persistSession = (session) => {
  localStorage.setItem("authToken", session.token);
  const user = normalizeUser(session.user);
  localStorage.setItem("userData", JSON.stringify(user));
  return user;
};

const requestSessionRefresh = () => {
  if (!refreshRequest) {
    refreshRequest = axios
      .post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const request = error.config;
        const url = request?.url || "";
        const isAuthRequest =
          url.includes("/api/auth/login") ||
          url.includes("/api/auth/register") ||
          url.includes("/api/auth/refresh") ||
          url.includes("/api/auth/logout");

        if (
          error.response?.status !== 401 ||
          !request ||
          request._retry ||
          isAuthRequest ||
          !localStorage.getItem("authToken")
        ) {
          return Promise.reject(error);
        }

        request._retry = true;
        try {
          const response = await requestSessionRefresh();
          const session = response.data.data;
          const refreshedUser = persistSession(session);
          setUser(refreshedUser);
          request.headers = {
            ...request.headers,
            Authorization: `Bearer ${session.token}`,
          };
          return axios(request);
        } catch (refreshError) {
          if (refreshError.response?.status === 401) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
            setUser(null);
          } else {
            console.error("Could not refresh authentication:", refreshError);
          }
          return Promise.reject(error);
        }
      },
    );

    return () => axios.interceptors.response.eject(interceptorId);
  }, []);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const token = localStorage.getItem("authToken");
      const userData = localStorage.getItem("userData");
      if (token && userData) {
        try {
          setUser(normalizeUser(JSON.parse(userData)));
        } catch {
          localStorage.removeItem("userData");
        }
      }

      try {
        const response = await requestSessionRefresh();
        const refreshedUser = persistSession(response.data.data);
        if (active) setUser(refreshedUser);
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("Could not restore authentication:", error);
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");
          if (active) setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password, role },
        { withCredentials: true },
      );
      const data = response.data;
      if (!data.status) throw new Error(data.message);

      const normalized = persistSession(data.data);
      setUser(normalized);

      toast.success(`Welcome back, ${data.data.user.name}!`);
      return data.data.user;
    } catch (error) {
      const message = error.response
        ? getApiErrorMessage(error, "Login failed. Please try again.")
        : "Unable to connect to the server. Check your connection and try again.";
      toast.error(message);
      throw error;
    }
  };

  const signup = async (formData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        formData,
        { withCredentials: true },
      );
      const data = response.data;
      if (!data.status) throw new Error(data.message);

      const normalized = persistSession(data.data);
      setUser(normalized);

      toast.success("Account created successfully!");
      return data.data.user;
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Signup failed. Please try again."),
      );
      throw error;
    }
  };

  const logout = () => {
    axios
      .post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true })
      .catch((error) => {
        console.error("Could not revoke authentication session:", error);
      });
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setUser(null);
    toast.success("Logged out successfully");
  };

  const updateProfile = async (updatedData) => {
    try {
      if (!user) throw new Error("Not authenticated");
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Missing auth token");

      const response = await axios.put(
        `${API_URL}/api/employees/update/${user.id || user._id}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = response.data;
      if (!data.status) throw new Error(data.message || "Update failed");

      const rawJoinDate = data.data.joinDate || data.data.startDate;
      const updatedUser = {
        ...user,
        ...data.data,
        joinDate: rawJoinDate
          ? new Date(rawJoinDate).toISOString().split("T")[0]
          : user.joinDate || "",
        avatar:
          data.data.profileImage ||
          user.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            data.data.name || user.name || "",
          )}&background=3b82f6&color=fff`,
      };
      setUser(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully");
      return updatedUser;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Profile update failed"));
      throw error;
    }
  };

  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!user || !token) throw new Error("Not authenticated");

      const response = await axios.put(
        `${API_URL}/api/auth/change-password/${user._id}`,
        { oldPassword, newPassword, confirmPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`, // if backend middleware checks JWT
          },
        },
      );

      const data = response.data;
      if (!data.status) throw new Error(data.message);

      toast.success(data.message || "Password changed successfully");
      return true;
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Password change failed. Please try again."),
      );
      throw error;
    }
  };

  const uploadProfileImage = async (file, userId) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!file || !userId || !token) throw new Error("Missing params");
      const form = new FormData();
      form.append("profile", file);
      const res = await axios.put(
        `${API_URL}/api/employees/upload-profile/${userId}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      if (res.data && res.data.data) {
        // update local user and storage if current user
        const updated = res.data.data;
        if (user && String(user.id || user._id) === String(userId)) {
          const merged = { ...user, ...updated };
          setUser(merged);
          localStorage.setItem("userData", JSON.stringify(merged));
        }
        return updated;
      }
      throw new Error(res.data?.message || "Upload failed");
    } catch (err) {
      console.error("Profile upload failed", err);
      toast.error(getApiErrorMessage(err, "Profile upload failed"));
      throw err;
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    uploadProfileImage,
    loading,
    isAuthenticated: !!user,
    isHR: user?.role === "hr",
    isEmployee: user?.role === "employee",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
