import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = import.meta.env.VITE_API_URL;

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("authToken");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

export const hrmsApi = createApi({
  reducerPath: "hrmsApi",
  baseQuery,
  tagTypes: [
    "Employee",
    "Department",
    "Leave",
    "Attendance",
    "Payroll",
    "Goal",
    "Device",
    "Job",
    "Payslip",
    "Event",
  ],
  endpoints: (builder) => ({
    getEmployees: builder.query<any[], void>({
      query: () => "/api/employees",
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((item: any) => ({
                type: "Employee" as const,
                id: item.id,
              })),
              { type: "Employee" as const, id: "LIST" },
            ]
          : [{ type: "Employee" as const, id: "LIST" }],
    }),
    getEmployee: builder.query<any, string>({
      query: (id) => `/api/employees/${id}`,
      transformResponse: (response: any) => response?.data || null,
      providesTags: (_result, _error, id) => [
        { type: "Employee", id },
      ],
    }),
    createEmployee: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/employees/create",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Employee", id: "LIST" }],
    }),
    updateEmployee: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/employees/edit/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Employee", id: arg.id },
        { type: "Employee", id: "LIST" },
      ],
    }),
    deleteEmployee: builder.mutation<any, string>({
      query: (id) => ({
        url: `/api/employees/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Employee", id: "LIST" }],
    }),

    getDepartments: builder.query<any[], void>({
      query: () => "/api/departments",
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: [{ type: "Department", id: "LIST" }],
    }),
    createDepartment: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/departments",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),
    updateDepartment: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/departments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),
    deleteDepartment: builder.mutation<any, string>({
      query: (id) => ({
        url: `/api/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),

    getLeaves: builder.query<any[], void>({
      query: () => "/api/leave",
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: [{ type: "Leave", id: "LIST" }],
    }),
    getAttendance: builder.query<any, Record<string, any>>({
      query: (params) => ({ url: "/api/attendance/me", params }),
      providesTags: [{ type: "Attendance", id: "LIST" }],
    }),
    getPayroll: builder.query<any[], void>({
      query: () => "/api/payroll",
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: [{ type: "Payroll", id: "LIST" }],
    }),
    getGoals: builder.query<any[], void>({
      query: () => "/api/goals",
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: [{ type: "Goal", id: "LIST" }],
    }),
    getDevices: builder.query<any[], void>({
      query: () => "/api/devices",
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: [{ type: "Device", id: "LIST" }],
    }),
    getJobs: builder.query<any[], void>({
      query: () => "/api/jobs",
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: [{ type: "Job", id: "LIST" }],
    }),
    getPayslips: builder.query<any[], void>({
      query: () => "/api/payslips",
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: [{ type: "Payslip", id: "LIST" }],
    }),
    getEvents: builder.query<any[], void>({
      query: () => "/api/events",
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: [{ type: "Event", id: "LIST" }],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetLeavesQuery,
  useGetAttendanceQuery,
  useGetPayrollQuery,
  useGetGoalsQuery,
  useGetDevicesQuery,
  useGetJobsQuery,
  useGetPayslipsQuery,
  useGetEventsQuery,
} = hrmsApi;
