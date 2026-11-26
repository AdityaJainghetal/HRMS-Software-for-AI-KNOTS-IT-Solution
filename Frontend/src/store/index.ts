import { configureStore } from "@reduxjs/toolkit";
import tasksReducer from "./tasksSlice";
import { hrmsApi } from "./apiSlice";

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    [hrmsApi.reducerPath]: hrmsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(hrmsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
