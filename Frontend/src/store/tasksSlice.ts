import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const normalizeTask = (task) => ({
  id: task._id,
  title: task.title,
  category: task.category,
  description: task.description || "",
  assignedTo: task.assignedTo?._id || task.assignedTo,
  assignedName: task.assignedTo?.name || "Unassigned",
  createdBy: task.createdBy?._id || task.createdBy,
  createdByName: task.createdBy?.name || "",
  startDateTime: task.startDateTime ? new Date(task.startDateTime) : new Date(),
  endDateTime: task.endDateTime ? new Date(task.endDateTime) : new Date(),
  createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
  status: String(task.status || "pending").toLowerCase(),
  priority: task.priority || "medium",
});

const initialState = {
  tasks: [],
  status: "idle",
  error: null,
};

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return rejectWithValue("Missing auth token");
    }

    try {
      const response = await axios.get(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (response.data?.data || []).map(normalizeTask);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (payload, { rejectWithValue }) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return rejectWithValue("Missing auth token");
    }

    try {
      const response = await axios.post(`${API_URL}/api/tasks`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return normalizeTask(response.data.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async (
    { id, payload }: { id: string; payload: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return rejectWithValue("Missing auth token");
    }

    try {
      const response = await axios.patch(
        `${API_URL}/api/tasks/${id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return normalizeTask(response.data.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id, { rejectWithValue }) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return rejectWithValue("Missing auth token");
    }

    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task,
        );
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      });
  },
});

export default tasksSlice.reducer;
