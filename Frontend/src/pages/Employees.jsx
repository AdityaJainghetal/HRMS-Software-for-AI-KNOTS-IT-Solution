import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Building2,
  Calendar,
  UserPlus,
  Users,
  LoaderCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  useGetEmployeesQuery,
  useGetDepartmentsQuery,
  useGetLeavesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from "../store/apiSlice";
const API_URL = import.meta.env.VITE_API_URL;

const Employees = () => {
  const { isHR } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeLoading, setSelectedEmployeeLoading] = useState(false);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [activeSection, setActiveSection] = useState(null);

  const {
    data: employees = [],
    isFetching: employeesLoading,
  } = useGetEmployeesQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: leaves = [] } = useGetLeavesQuery();
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  const departmentNames = useMemo(
    () => departments.map((d) => d.name),
    [departments],
  );

  const marginStyle = {
    marginBottom: "10px",
  };

  const button = {
    width: "200px",
  };

  const API_BASE = API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    departmentId: "",
    position: "",
    salary: "",
    leaveBalance: "",
    address: "",
    joinDate: "",
    gender: "",
  });

  const filteredEmployees = employees.filter((employee) => {
    const q = (searchTerm || "").toLowerCase();
    const name = (employee?.name || "").toString().toLowerCase();
    const email = (employee?.email || "").toString().toLowerCase();
    const dept = (employee?.department || "").toString().toLowerCase();

    const matchesSearch =
      q === "" || name.includes(q) || email.includes(q) || dept.includes(q);
    const matchesDepartment =
      filterDepartment === "all" || employee?.department === filterDepartment;
    const matchesStatus =
      statusFilter === "all" || employee?.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const EMPLOYEES_PAGE_SIZE = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / EMPLOYEES_PAGE_SIZE),
  );
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * EMPLOYEES_PAGE_SIZE,
    currentPage * EMPLOYEES_PAGE_SIZE,
  );

  const handleStatClick = (type) => {
    if (type === "total") {
      setStatusFilter("all");
      setActiveSection(null);
    } else if (type === "active") {
      setStatusFilter("active");
      setActiveSection(null);
    } else if (type === "on_leave") {
      setActiveSection("leave");
    } else if (type === "departments") {
      setActiveSection("departments");
    }
  };

  const calculateLeaveBalanceFromJoinDate = (joinDateValue, gender) => {
    if (!joinDateValue) return { monthly: 0, menstrual: 0, total: 0 };
    const [joinYear, joinMonth, joinDay] = joinDateValue.split("-").map(Number);
    const joinDate = new Date(joinYear, joinMonth - 1, joinDay);
    if (Number.isNaN(joinDate.getTime())) {
      return { monthly: 0, menstrual: 0, total: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const referenceDate = joinDate > today ? joinDate : today;
    const financialYearStartYear =
      referenceDate.getMonth() >= 3
        ? referenceDate.getFullYear()
        : referenceDate.getFullYear() - 1;
    const financialYearStart = new Date(financialYearStartYear, 3, 1);
    let monthly = 0;

    for (let index = 0; index < 2400; index += 1) {
      const monthIndex = joinDate.getMonth() + index;
      const year = joinDate.getFullYear() + Math.floor(monthIndex / 12);
      const month = monthIndex % 12;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const accrualDate = new Date(
        year,
        month,
        Math.min(joinDate.getDate(), lastDay),
      );
      if (accrualDate > referenceDate) break;
      if (accrualDate >= financialYearStart) {
        monthly += index === 0 && joinDate.getDate() > 15 ? 1 : 2;
      }
    }

    const menstrual = gender === "female" ? 1 : 0;
    return { monthly, menstrual, total: monthly + menstrual };
  };

  const calculatedLeaveAllocation = calculateLeaveBalanceFromJoinDate(
    newEmployee.joinDate,
    newEmployee.gender,
  );
  const calculatedLeaveBalance = calculatedLeaveAllocation.total;

  const calculatedEditLeaveAllocation = editingEmployee
    ? calculateLeaveBalanceFromJoinDate(
        editingEmployee.joinDate,
        editingEmployee.gender,
      )
    : { monthly: 0, menstrual: 0, total: 0 };
  const calculatedEditLeaveBalance = calculatedEditLeaveAllocation.total;

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.departmentId) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const payload = {
        name: newEmployee.name,
        email: newEmployee.email,
        password: newEmployee.password,
        phone: newEmployee.phone,
        departmentId: newEmployee.departmentId,
        position: newEmployee.position,
        salary: newEmployee.salary ? Number(newEmployee.salary) : undefined,
        address: newEmployee.address,
        joinDate: newEmployee.joinDate,
        gender: newEmployee.gender,
        status: "active",
      };
      await createEmployee(payload).unwrap();

      setNewEmployee({
        name: "",
        email: "",
        password: "",
        phone: "",
        departmentId: "",
        position: "",
        salary: "",
        address: "",
        joinDate: "",
        gender: "",
      });
      setShowAddDialog(false);
      toast.success("Employee added successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add employee");
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee({
      ...employee,
      departmentId: employee.departmentId || employee.department?._id || "",
      salary: employee?.salary != null ? String(employee.salary) : "",
      joinDate: employee.joinDate || "",
      gender: employee.gender || "",
    });
  };

  const handleUpdateEmployee = async () => {
    if (
      !editingEmployee?.name ||
      !editingEmployee?.email ||
      !editingEmployee?.departmentId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const payload = {
        name: editingEmployee.name,
        email: editingEmployee.email,
        phone: editingEmployee.phone,
        departmentId: editingEmployee.departmentId,
        position: editingEmployee.position,
        salary: editingEmployee.salary
          ? Number(editingEmployee.salary)
          : undefined,
        joinDate: editingEmployee.joinDate,
        gender: editingEmployee.gender,
      };
      await updateEmployee({
        id: editingEmployee.id,
        body: payload,
      }).unwrap();
      setEditingEmployee(null);
      toast.success("Employee updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update employee");
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;
    try {
      await deleteEmployee(id).unwrap();
      toast.success("Employee removed successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to remove employee");
    }
  };

  const fetchEmployeeDetails = async (id) => {
    if (!id) return;
    setSelectedEmployeeLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedEmployee(res.data?.data || null);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load employee details",
      );
    } finally {
      setSelectedEmployeeLoading(false);
    }
  };

  const handleViewEmployee = (employee) => {
    if (!employee?.id) return;
    setShowEmployeeDetails(true);
    setSelectedEmployee(null);
    fetchEmployeeDetails(employee.id);
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString();
  };

  const formatDuration = (milliseconds) => {
    const totalSeconds = Math.max(0, Math.floor((milliseconds || 0) / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getSessionDuration = (employee) => {
    if (employee?.isOnline && employee?.currentLoginAt) {
      return (
        new Date().getTime() - new Date(employee.currentLoginAt).getTime()
      );
    }
    return employee?.lastSessionDurationMs || 0;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "on_leave":
        return <Badge variant="secondary">On Leave</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!isHR) {
    return (
      <div className="container mx-auto p-6 text-center py-12">
        <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground">
          Only HR managers can access employee management.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage your organization's workforce
          </p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          {/* <DialogTrigger asChild>
            <Button className="btn-gradient w-min">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger> */}

          <DialogTrigger asChild style={{ ...marginStyle, ...button }}>
            <Button className="btn-gradient">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Enter employee details to add them to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, password: e.target.value })
                  }
                  placeholder="Enter password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newEmployee.phone}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={newEmployee.departmentId}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, departmentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={newEmployee.salary}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, salary: e.target.value })
                    }
                    placeholder="Annual salary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={newEmployee.gender}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveBalance">
                    Leave Balance (Auto-calculated)
                  </Label>
                  <Input
                    id="leaveBalance"
                    type="number"
                    min="0"
                    readOnly
                    value={
                      calculatedLeaveBalance
                        ? String(calculatedLeaveBalance)
                        : ""
                    }
                    placeholder="Calculated from join date and gender"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={newEmployee.position}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, position: e.target.value })
                  }
                  placeholder="Job title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={newEmployee.joinDate}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, joinDate: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {newEmployee.joinDate
                    ? `Initial balance: ${calculatedLeaveBalance} days (Monthly: ${calculatedLeaveAllocation.monthly}, Menstrual: ${calculatedLeaveAllocation.menstrual})`
                    : "Select a join date to calculate the initial Monthly and Menstrual Leave balances."}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEmployee} className="btn-gradient">
                Add Employee
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-4">
        <Card
          className="flex-1 min-w-[220px] cursor-pointer"
          onClick={() => handleStatClick("total")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="flex-1 min-w-[220px] cursor-pointer"
          onClick={() => handleStatClick("active")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Active Employees
                </p>
                <p className="text-2xl font-bold">
                  {employees.filter((e) => e.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="flex-1 min-w-[220px] cursor-pointer"
          onClick={() => handleStatClick("on_leave")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leave Requests</p>
                <p className="text-2xl font-bold">{leaves.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="flex-1 min-w-[220px] cursor-pointer"
          onClick={() => handleStatClick("departments")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12"
              />
            </div>
            <Select
              value={filterDepartment}
              onValueChange={setFilterDepartment}
            >
              <SelectTrigger className="w-[220px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentNames.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                onClick={() => setViewMode("table")}
              >
                Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Section */}
      {activeSection === "leave" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6" /> Leave Requests ({leaves.length}
                )
              </h2>
              <Button variant="outline" onClick={() => setActiveSection(null)}>
                Hide
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((leave) => (
                    <TableRow key={leave._id}>
                      <TableCell>{leave.employee?.name || "N/A"}</TableCell>
                      <TableCell className="capitalize">{leave.type}</TableCell>
                      <TableCell>
                        {new Date(leave.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(leave.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{leave.days}</TableCell>
                      <TableCell>{leave.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            leave.status === "approved"
                              ? "default"
                              : leave.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {leave.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Departments Section */}
      {activeSection === "departments" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6" /> Departments Overview
              </h2>
              <Button variant="outline" onClick={() => setActiveSection(null)}>
                Hide
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Established</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Avg Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-semibold">{dept.name}</TableCell>
                    <TableCell>{dept.description}</TableCell>
                    <TableCell>{dept.location}</TableCell>
                    <TableCell>{dept.established}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {dept.employeeCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      $
                      {dept.averageSalary
                        ? Number(dept.averageSalary).toLocaleString()
                        : "0"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      {!activeSection && (
        <Card>
          <CardContent className="p-0">
            {employeesLoading ? (
              <div
                className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
                <span>Loading employees...</span>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {paginatedEmployees.map((employee) => (
                  <Card
                    key={employee.id}
                    className="cursor-pointer hover:shadow-lg"
                    onClick={() => handleViewEmployee(employee)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback>
                              {employee.name?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{employee.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {employee.position}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(employee.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Login Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Last Logout</TableHead>
                    <TableHead>Session Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((employee) => (
                    <TableRow
                      key={employee.id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleViewEmployee(employee)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback>
                              {employee.name?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p>{employee.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {employee.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        ₹{(employee.salary || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.isOnline ? "default" : "outline"}>
                          {employee.isOnline ? "Online" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(employee.lastLogin)}</TableCell>
                      <TableCell>{formatDateTime(employee.lastLogout)}</TableCell>
                      <TableCell>{formatDuration(getSessionDuration(employee))}</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEmployee(employee);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEmployee(employee.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!employeesLoading && filteredEmployees.length > 0 && (
              <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * EMPLOYEES_PAGE_SIZE + 1} -{" "}
                  {Math.min(
                    currentPage * EMPLOYEES_PAGE_SIZE,
                    filteredEmployees.length,
                  )}{" "}
                  of {filteredEmployees.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Employee Details Dialog */}
      <Dialog open={showEmployeeDetails} onOpenChange={setShowEmployeeDetails}>
        <DialogContent style={{ maxHeight: "90vh", overflowY: "auto" }}>
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployeeLoading ? (
            <p>Loading...</p>
          ) : selectedEmployee ? (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedEmployee.avatar} />
                  <AvatarFallback>
                    {selectedEmployee.name?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.employeeId}
                  </p>
                  <div className="mt-2">
                    {getStatusBadge(selectedEmployee.status)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{selectedEmployee.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p>{selectedEmployee.phone || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p>{selectedEmployee.department || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p>{selectedEmployee.position || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p>
                    {selectedEmployee.salary != null
                      ? `$${selectedEmployee.salary.toLocaleString()}/year`
                      : "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Leave Balance</p>
                  <p>
                    {selectedEmployee.leaveBalance != null
                      ? selectedEmployee.leaveBalance
                      : "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Join Date</p>
                  <p>{selectedEmployee.joinDate || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Login Status</p>
                  <Badge variant={selectedEmployee.isOnline ? "default" : "outline"}>
                    {selectedEmployee.isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Last Login</p>
                  <p>{formatDateTime(selectedEmployee.lastLogin)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Last Logout</p>
                  <p>{formatDateTime(selectedEmployee.lastLogout)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.isOnline ? "Current Session" : "Last Session Time"}
                  </p>
                  <p>{formatDuration(getSessionDuration(selectedEmployee))}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p>{selectedEmployee.dateOfBirth || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p>{selectedEmployee.gender || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p>{selectedEmployee.experience || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">College</p>
                  <p>{selectedEmployee.college || "—"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Bio</p>
                <p>{selectedEmployee.bio || "—"}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Skills</p>
                <p>{selectedEmployee.skills || "—"}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Emergency Contact
                  </p>
                  <p>{selectedEmployee.emergencyContact || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p>{selectedEmployee.address || "—"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No employee selected.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== EDIT EMPLOYEE DIALOG (FIXED) ==================== */}
      <Dialog
        open={!!editingEmployee}
        onOpenChange={() => setEditingEmployee(null)}
      >
        <DialogContent style={{ maxHeight: "90vh", overflowY: "auto" }}>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information below
            </DialogDescription>
          </DialogHeader>

          {editingEmployee && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={editingEmployee.name || ""}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editingEmployee.email || ""}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editingEmployee.phone || ""}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={editingEmployee.departmentId}
                    onValueChange={(value) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        departmentId: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Salary</Label>
                  <Input
                    type="number"
                    value={editingEmployee.salary || ""}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        salary: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  value={editingEmployee.position || ""}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      position: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={editingEmployee.gender || ""}
                  onValueChange={(value) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      gender: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Join Date</Label>
                <Input
                  type="date"
                  value={editingEmployee.joinDate || ""}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      joinDate: e.target.value,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {editingEmployee.joinDate
                    ? `Calculated balance: ${calculatedEditLeaveBalance} days (Monthly: ${calculatedEditLeaveAllocation.monthly}, Menstrual: ${calculatedEditLeaveAllocation.menstrual}).`
                    : "Select a join date to recalculate Monthly and Menstrual Leave balances."}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditingEmployee(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee}>Update Employee</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
