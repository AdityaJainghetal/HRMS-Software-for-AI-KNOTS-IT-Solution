import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";
import "./Attendance.css";

const Attendance = () => {
  const { user } = useAuth();
  const isHR = user?.role === "hr";

  // States
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // HR Only States
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Data States
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  const getAuthToken = () => localStorage.getItem("authToken");

  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Session expired. Please login again.");
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Handle File Change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadMessage("");
  };

  // Upload Attendance
  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file");
    if (!selectedEmployeeId) return toast.error("Please select an employee");

    const token = getAuthToken();
    if (!token) return;

    setUploading(true);
    setUploadMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("employeeId", selectedEmployeeId);

    try {
      const res = await axios.post(
        "https://hrms-software-for-ai-knots-it-solution.onrender.com/api/attendance/upload-attendance",
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const message = res.data.message || "Upload successful!";
      setUploadMessage(message);
      setFile(null);
      toast.success(message);

      fetchAttendance(); // Refresh list after upload
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setUploadMessage("Upload failed: " + errorMsg);
      toast.error("Upload failed: " + errorMsg);
    } finally {
      setUploading(false);
    }
  };

  // Fetch Employees (HR only)
  const fetchEmployees = async () => {
    if (!isHR) {
      setFetchingEmployees(false);
      return;
    }

    const config = getAuthHeaders();
    if (!config) return;

    try {
      const res = await axios.get(
        "https://hrms-software-for-ai-knots-it-solution.onrender.com/api/employees",
        config,
      );
      setEmployees(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired!");
      }
    } finally {
      setFetchingEmployees(false);
    }
  };

  // Fetch Attendance Records
  const fetchAttendance = async () => {
    const config = getAuthHeaders();
    if (!config) return;

    setLoading(true);
    try {
      let res;

      if (isHR) {
        const params = {};
        if (selectedEmployeeId) params.employeeId = selectedEmployeeId;
        if (selectedMonth) params.month = selectedMonth;

        res = await axios.get(
          "https://hrms-software-for-ai-knots-it-solution.onrender.com/api/attendance/datefilter",
          {
            params,
            ...config,
          },
        );
      } else {
        const params = {};
        if (selectedMonth) {
          params.month = selectedMonth;
        } else {
          params.limit = 31;
        }
        res = await axios.get(
          "https://hrms-software-for-ai-knots-it-solution.onrender.com/api/attendance/me",
          {
            params,
            ...config,
          },
        );
      }

      setData(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setData([]);
      if (error.response?.status === 401) {
        toast.error("Not authorized!");
      } else {
        toast.error("Failed to load attendance data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, [isHR]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchAttendance();
  }, [selectedEmployeeId, selectedMonth, isHR]);

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEmployeeId, selectedMonth, searchTerm, isHR]);

  // Filter data for search
  const filteredData = data.filter((item) => {
    if (!searchTerm.trim()) return true;
    const empName = (item.employee?.name || "").toLowerCase();
    return empName.includes(searchTerm.toLowerCase().trim());
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const getCheckInMinutes = (value) => {
    const match = String(value || "")
      .trim()
      .match(/^(\d{1,2}):(\d{2})(?:\s*([ap])\.?m\.?)?$/i);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3]?.toLowerCase();
    if (minutes > 59 || hours > (meridiem ? 12 : 23)) return null;
    if (meridiem) {
      if (hours < 1) return null;
      hours = (hours % 12) + (meridiem === "p" ? 12 : 0);
    }

    return hours * 60 + minutes;
  };

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lateMinutesThisMonth = data.reduce((total, item) => {
    const attendanceMonth = String(item.date || "").slice(0, 7);
    if (attendanceMonth !== (selectedMonth || currentMonth)) return total;

    const checkInMinutes = getCheckInMinutes(item.checkIn);
    return checkInMinutes == null
      ? total
      : total + Math.max(checkInMinutes - 10 * 60, 0);
  }, 0);
  const salaryDeductionDays =
    lateMinutesThisMonth >= 180
      ? 3
      : lateMinutesThisMonth >= 120
        ? 2
        : lateMinutesThisMonth >= 90
          ? 1
          : 0;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const statusLegend = [
    { code: "P", meaning: "Present" },
    { code: "A", meaning: "Absent" },
    { code: "H", meaning: "Holiday" },
    { code: "Sunday", meaning: "Sunday" },
    { code: "W", meaning: "Weekly Off" },
    { code: "LH", meaning: "Less Hours" },
    { code: "HD", meaning: "Half Day" },
    { code: "PW", meaning: "Present On WeekOff" },
    { code: "PH", meaning: "Present On Holiday" },
    { code: "PHW", meaning: "Present On Holiday & WeekOff" },
    { code: "XX", meaning: "Not Applicable" },
    { code: "CL", meaning: "Casual Leave" },
    { code: "HCL", meaning: "Half Casual Leave" },
  ];

  const statusOptions = [
    { value: "", label: "Select status" },
    { value: "P", label: "Present" },
    { value: "A", label: "Absent" },
    { value: "H", label: "Holiday" },
    { value: "Sunday", label: "Sunday" },
    { value: "W", label: "Weekly Off" },
    { value: "LH", label: "Less Hours" },
    { value: "HD", label: "Half Day" },
    { value: "PW", label: "Present On WeekOff" },
    { value: "PH", label: "Present On Holiday" },
    { value: "PHW", label: "Present On Holiday & WeekOff" },
    { value: "XX", label: "Not Applicable" },
    { value: "CL", label: "Casual Leave" },
    { value: "HCL", label: "Half Casual Leave" },
  ];

  const handleStatusChange = async (item, newStatus) => {
    const token = getAuthToken();
    if (!token) return;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const employeeId =
      item.employee?._id || item.employee?.id || item.employeeId;
    const date = item.date;
    if (!employeeId || !date) return;

    setStatusUpdatingId(item._id || `${employeeId}-${date}`);
    try {
      await axios.post(
        "https://hrms-software-for-ai-knots-it-solution.onrender.com/api/attendance/upsert",
        {
          employeeId,
          date,
          status: newStatus || null,
        },
        config,
      );

      setData((prev) =>
        prev.map((row) =>
          row._id === item._id
            ? {
                ...row,
                status: newStatus,
              }
            : row,
        ),
      );
      toast.success("Attendance status updated successfully.");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update attendance status",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const formatFullDate = (dateValue) => {
    if (!dateValue) return "—";

    let date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === "string") {
      const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      } else {
        date = new Date(dateValue);
      }
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="attendance-page">
      {isHR ? (
        // ==================== HR INTERFACE ====================
        <>
          <h1>Attendance Management</h1>

          {/* Status Legend */}
          <div
            style={{
              marginBottom: "30px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
            className="attendance-surface"
          >
            <h3>Attendance Status Legend</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: "8px 20px",
              }}
            >
              {statusLegend.map((item, index) => (
                <div key={index} style={{ display: "flex", gap: "10px" }}>
                  <strong
                    style={{ color: "#007bff", minWidth: "50px" }}
                    className="attendance-status-code"
                  >
                    {item.code}
                  </strong>
                  <span>: {item.meaning}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div
            style={{
              marginBottom: "30px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "#fff",
            }}
            className="attendance-surface"
          >
            <h2>Filters</h2>
            <div
              style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                alignItems: "end",
              }}
              className="attendance-filter-controls"
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Select Employee:
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  disabled={fetchingEmployees}
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                  }}
                  className="attendance-employee-select"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id || emp.id} value={emp._id || emp.id}>
                      {emp.name} {emp.employeeId ? `(${emp.employeeId})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Select Month:
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                  }}
                  className="attendance-month-input"
                />
              </div>

              {/* <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Search by Name:
                </label>
                <input
                  type="text"
                  placeholder="Search employee name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "10px",
                    width: "280px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                  }}
                />
              </div> */}

              <button
                onClick={() => {
                  setSelectedEmployeeId("");
                  setSelectedMonth("");
                  setSearchTerm("");
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  height: "45px",
                }}
              >
                Clear All
              </button>

              <button
                onClick={fetchAttendance}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  height: "45px",
                }}
              >
                {loading ? "Fetching..." : "Fetch Data"}
              </button>
            </div>
          </div>

          {/* Upload Section */}
          <div
            style={{
              marginBottom: "40px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "#fff",
            }}
            className="attendance-surface"
          >
            <h2>Upload Attendance for Selected Employee</h2>

            <div
              style={{
                marginBottom: "15px",
                padding: "12px",
                backgroundColor: "#e7f3ff",
                borderRadius: "6px",
              }}
              className="attendance-upload-selected"
            >
              <strong>Selected Employee: </strong>
              {selectedEmployeeId ? (
                employees.find(
                  (e) => String(e._id || e.id) === String(selectedEmployeeId),
                )?.name || "Unknown"
              ) : (
                <span style={{ color: "red" }}>
                  Please select an employee first
                </span>
              )}
            </div>

            <p style={{ color: "#666", marginBottom: "15px" }}>
              File should contain:{" "}
              <strong>Date, CheckIn, CheckOut, TotalHours</strong>
              <br />
              <strong>Name and EmpID will be ignored</strong> — Employee is
              taken from dropdown above.
            </p>

            <div style={{ marginBottom: "15px" }}>
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
                style={{ marginRight: "15px" }}
              />
              <button
                onClick={handleUpload}
                disabled={uploading || !file || !selectedEmployeeId}
                style={{
                  padding: "12px 25px",
                  backgroundColor:
                    uploading || !file || !selectedEmployeeId
                      ? "#ccc"
                      : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor:
                    uploading || !file || !selectedEmployeeId
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "16px",
                }}
              >
                {uploading ? "Uploading..." : "Upload Attendance"}
              </button>
            </div>

            {uploadMessage && (
              <p
                style={{
                  color: uploadMessage.toLowerCase().includes("failed")
                    ? "red"
                    : "green",
                  fontWeight: "bold",
                }}
              >
                {uploadMessage}
              </p>
            )}
          </div>

          {/* Attendance List */}
          <div>
            <h2>
              Attendance Records ({filteredData.length})
              {filteredData.length > PAGE_SIZE && (
                <span style={{ fontSize: "14px", color: "#666" }}>
                  {" "}
                  • Showing {Math.min(PAGE_SIZE, filteredData.length)} per page
                </span>
              )}
            </h2>

            {loading ? (
              <p>Loading...</p>
            ) : filteredData.length === 0 ? (
              <p>No records found.</p>
            ) : (
              <>
                <div className="attendance-table-wrap">
                  <table
                    border="1"
                    cellPadding="12"
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                    className="attendance-records-table"
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f4f4f4" }}>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Total Hours</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item, index) => (
                        <tr key={item._id || index}>
                          <td>
                            <strong>{item.employee?.name || "N/A"}</strong>
                          </td>
                          <td>{formatFullDate(item.date)}</td>
                          <td>
                            <select
                              value={item.status || ""}
                              onChange={(e) =>
                                handleStatusChange(item, e.target.value)
                              }
                              disabled={statusUpdatingId === item._id}
                              style={{
                                padding: "8px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                minWidth: "140px",
                              }}
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>{item.checkIn || "—"}</td>
                          <td>{item.checkOut || "—"}</td>
                          <td>{item.totalHours || "—"}</td>
                          <td>{item.location || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div
                    style={{
                      marginTop: "15px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ color: "#666" }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                          backgroundColor:
                            currentPage === 1 ? "#f1f1f1" : "white",
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                          backgroundColor:
                            currentPage === totalPages ? "#f1f1f1" : "white",
                          cursor:
                            currentPage === totalPages
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        // ==================== EMPLOYEE INTERFACE ====================
        <>
          <div
            className="attendance-header"
            style={{ marginBottom: "20px" }}
          ></div>
          <div
            style={{
              marginBottom: "20px",
              padding: "20px",
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderLeft: "4px solid #ea580c",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
            }}
            className="attendance-summary"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px 16px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#111827" }}>
                  Monthly Attendance Summary
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Late arrival is counted after 10:00 AM
                </p>
              </div>
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
                className="attendance-summary-date"
              >
                {selectedMonth || currentMonth}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "12px",
                marginTop: "18px",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "6px",
                  backgroundColor: "hsl(var(--sidebar-background))",
                }}
                className="attendance-summary-metric attendance-summary-metric--late"
              >
                <p
                  style={{
                    margin: 0,
                    color: "#9a3412",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  TOTAL LATE TIME
                </p>
                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#7c2d12",
                    fontSize: "26px",
                    fontWeight: 700,
                  }}
                >
                  {lateMinutesThisMonth}{" "}
                  <span style={{ fontSize: "15px", fontWeight: 500 }}>min</span>
                </p>
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "6px",
                  backgroundColor: "#f9fafb",
                }}
                className="attendance-summary-metric attendance-summary-metric--deduction"
              >
                <p
                  style={{
                    margin: 0,
                    color: "#4b5563",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  ESTIMATED SALARY DEDUCTION
                </p>
                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#111827",
                    fontSize: "26px",
                    fontWeight: 700,
                  }}
                >
                  {salaryDeductionDays}{" "}
                  <span style={{ fontSize: "15px", fontWeight: 500 }}>
                    day(s)
                  </span>
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "14px",
              }}
            >
              {[
                { minutes: 90, days: 1 },
                { minutes: 120, days: 2 },
                { minutes: 180, days: 3 },
              ].map((rule) => (
                <div
                  key={rule.minutes}
                  style={{
                    flex: "1 1 150px",
                    padding: "9px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    color: "#374151",
                    fontSize: "13px",
                  }}
                  className="attendance-summary-rule"
                >
                  <strong style={{ color: "#111827" }}>
                    {rule.minutes} min
                  </strong>
                  <span> late = </span>
                  <strong style={{ color: "#c2410c" }}>
                    {rule.days} day(s)
                  </strong>
                  <span> deduction</span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              marginBottom: "30px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
            className="attendance-surface"
          >
            <h3>Attendance Status Legend</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: "8px 20px",
              }}
            >
              {statusLegend.map((item, index) => (
                <div key={index} style={{ display: "flex", gap: "10px" }}>
                  <strong
                    style={{ color: "#007bff", minWidth: "50px" }}
                    className="attendance-status-code"
                  >
                    {item.code}
                  </strong>
                  <span>: {item.meaning}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginBottom: "30px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "#fff",
            }}
            className="attendance-surface"
          >
            <h2>Filter by Month</h2>
            <div
              style={{ display: "flex", alignItems: "center", gap: "16px" }}
              className="attendance-month-controls"
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Select Month:
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                  }}
                  className="attendance-month-input"
                />
              </div>
              <button
                onClick={() => setSelectedMonth("")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  height: "45px",
                }}
              >
                Clear Month
              </button>
            </div>
          </div>

          <div>
            <h2>
              My Attendance Records ({filteredData.length})
              {filteredData.length > PAGE_SIZE && (
                <span style={{ fontSize: "14px", color: "#666" }}>
                  {" "}
                  • Showing {Math.min(PAGE_SIZE, filteredData.length)} per page
                </span>
              )}
            </h2>

            {loading ? (
              <p>Loading...</p>
            ) : filteredData.length === 0 ? (
              <p>No attendance records found.</p>
            ) : (
              <>
                <div className="attendance-table-wrap">
                  <table
                    border="1"
                    cellPadding="12"
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                    className="attendance-records-table attendance-records-table--employee"
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f4f4f4" }}>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Total Hours</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item, index) => (
                        <tr key={item._id || index}>
                          <td>{formatFullDate(item.date)}</td>
                          <td>
                            <strong style={{ color: "#007bff" }}>
                              {item.status}
                            </strong>
                          </td>
                          <td>{item.checkIn || "—"}</td>
                          <td>{item.checkOut || "—"}</td>
                          <td>{item.totalHours || "—"}</td>
                          <td>{item.location || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div
                    style={{
                      marginTop: "15px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ color: "#666" }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                          backgroundColor:
                            currentPage === 1 ? "#f1f1f1" : "white",
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                          backgroundColor:
                            currentPage === totalPages ? "#f1f1f1" : "white",
                          cursor:
                            currentPage === totalPages
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Attendance;
