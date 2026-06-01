import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";

const Attendance = () => {
  const { user } = useAuth();
  const isHR = user?.role === "hr";

  // States
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // HR Only States
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Data States
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);

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
        "https://hrms-software-for-ai-knots-it-solution-1.onrender.com/api/attendance/upload-attendance",
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
        "https://hrms-software-for-ai-knots-it-solution-1.onrender.com/api/employees",
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
        if (selectedDate) params.date = selectedDate;

        res = await axios.get(
          "https://hrms-software-for-ai-knots-it-solution-1.onrender.com/api/attendance/datefilter",
          {
            params,
            ...config,
          },
        );
      } else {
        res = await axios.get(
          "https://hrms-software-for-ai-knots-it-solution-1.onrender.com/api/attendance/me",
          {
            params: { limit: 30 },
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

  // Re-fetch when HR filters change
  useEffect(() => {
    if (isHR) {
      fetchAttendance();
    }
  }, [selectedEmployeeId, selectedDate, isHR]);

  // Filter data for search
  const filteredData = data.filter((item) => {
    if (!searchTerm.trim()) return true;
    const empName = (item.employee?.name || "").toLowerCase();
    return empName.includes(searchTerm.toLowerCase().trim());
  });

  const statusLegend = [
    { code: "P", meaning: "Present" },
    { code: "A", meaning: "Absent" },
    { code: "H", meaning: "Holiday" },
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

  const formatFullDate = (dateValue) => {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
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
          >
            <h3>Attendance Status Legend</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "8px 20px",
              }}
            >
              {statusLegend.map((item, index) => (
                <div key={index} style={{ display: "flex", gap: "10px" }}>
                  <strong style={{ color: "#007bff", minWidth: "50px" }}>
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
          >
            <h2>Filters</h2>
            <div
              style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                alignItems: "end",
              }}
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
                    width: "300px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                  }}
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
                  Select Date:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                  }}
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
                  setSelectedDate("");
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
          >
            <h2>Upload Attendance for Selected Employee</h2>

            <div
              style={{
                marginBottom: "15px",
                padding: "12px",
                backgroundColor: "#e7f3ff",
                borderRadius: "6px",
              }}
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
            <h2>Attendance Records ({filteredData.length})</h2>

            {loading ? (
              <p>Loading...</p>
            ) : filteredData.length === 0 ? (
              <p>No records found.</p>
            ) : (
              <table
                border="1"
                cellPadding="12"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
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
                  {filteredData.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>
                        <strong>{item.employee?.name || "N/A"}</strong>
                      </td>
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
            )}
          </div>
        </>
      ) : (
        // ==================== EMPLOYEE INTERFACE ====================
        <>
          <h1>My Attendance</h1>
          <div style={{ marginBottom: "30px" }}>
            <p style={{ fontSize: "16px", color: "#666" }}>
              Viewing attendance records for: <strong>{user?.name}</strong>
            </p>
          </div>

          <div>
            <h2>My Attendance Records ({filteredData.length})</h2>

            {loading ? (
              <p>Loading...</p>
            ) : filteredData.length === 0 ? (
              <p>No attendance records found.</p>
            ) : (
              <table
                border="1"
                cellPadding="12"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
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
                  {filteredData.map((item, index) => (
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
            )}
          </div>
        </>
      )}

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default Attendance;
