// // // import { useEffect, useState } from "react";
// // // import { useAuth } from "../contexts/AuthContext";
// // // import { Button } from "../components/ui/button";
// // // import { Input } from "../components/ui/input";
// // // import {
// // //   Card,
// // //   CardContent,
// // //   CardDescription,
// // //   CardHeader,
// // //   CardTitle,
// // // } from "../components/ui/card";
// // // import { Badge } from "../components/ui/badge";
// // // import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
// // // import {
// // //   Select,
// // //   SelectContent,
// // //   SelectItem,
// // //   SelectTrigger,
// // //   SelectValue,
// // // } from "../components/ui/select";
// // // import {
// // //   Dialog,
// // //   DialogContent,
// // //   DialogDescription,
// // //   DialogHeader,
// // //   DialogTitle,
// // //   DialogTrigger,
// // // } from "../components/ui/dialog";
// // // import { Label } from "../components/ui/label";
// // // import { Textarea } from "../components/ui/textarea";
// // // import {
// // //   Table,
// // //   TableBody,
// // //   TableCell,
// // //   TableHead,
// // //   TableHeader,
// // //   TableRow,
// // // } from "../components/ui/table";
// // // import {
// // //   Search,
// // //   Plus,
// // //   Filter,
// // //   Check,
// // //   X,
// // //   Calendar,
// // //   Clock,
// // //   FileText,
// // //   UserCheck,
// // // } from "lucide-react";
// // // import { toast } from "react-toastify";
// // // import axios from "axios";
// // // import { postActivity } from "../lib/postActivity";

// // // const API_URL = import.meta.env.VITE_API_URL;

// // // const LeaveRequests = () => {
// // //   const { isHR, user } = useAuth();
// // //   const [searchTerm, setSearchTerm] = useState("");
// // //   const [filterStatus, setFilterStatus] = useState("all");
// // //   const [showAddDialog, setShowAddDialog] = useState(false);

// // //   const API_BASE = API_URL;
// // //   const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
// // //   const userId = user?.id || user?._id;

// // //   const [leaveRequests, setLeaveRequests] = useState([]);
// // //   const [currentLeaveBalance, setCurrentLeaveBalance] = useState(null);
// // //   const [balanceLoading, setBalanceLoading] = useState(false);

// // //   const [newLeave, setNewLeave] = useState({
// // //     leaveType: "",
// // //     startDate: "",
// // //     endDate: "",
// // //     reason: "",
// // //     isHalfDay: false,
// // //   });

// // //   const statusOptions = ["all", "pending", "approved", "rejected"];
// // //   const maxSickPersonal = 2;

// // //   // Calculate used leaves
// // //   const sickUsed = leaveRequests.filter(r => r.leaveType === "Sick Leave" && r.status === "approved").length;
// // //   const personalUsed = leaveRequests.filter(r => r.leaveType === "Personal Leave" && r.status === "approved").length;

// // //   const leaveTypeOptions = [
// // //     { value: "Annual Leave", label: "Annual Leave" },
// // //     { value: "Sick Leave", label: `Sick Leave (${sickUsed}/${maxSickPersonal})` },
// // //     { value: "Personal Leave", label: `Personal Leave (${personalUsed}/${maxSickPersonal})` },
// // //     { value: "Maternity Leave", label: "Maternity Leave" },
// // //     { value: "Paternity Leave", label: "Paternity Leave" },
// // //     { value: "Casual Leave", label: "Casual Leave" },
// // //     { value: "Earned Leave", label: "Earned Leave" },
// // //     { value: "Study Leave", label: "Study Leave" },
// // //   ];

// // //   const toBackendType = (type) => {
// // //     const map = {
// // //       "Annual Leave": "vacation",
// // //       "Sick Leave": "sick",
// // //       "Personal Leave": "personal",
// // //       "Maternity Leave": "maternity",
// // //       "Paternity Leave": "paternity",
// // //       "Casual Leave": "casual",
// // //       "Earned Leave": "earned",
// // //       "Study Leave": "study",
// // //     };
// // //     return map[type] || "personal";
// // //   };

// // //   const toFrontendType = (type) => {
// // //     const map = {
// // //       vacation: "Annual Leave",
// // //       sick: "Sick Leave",
// // //       personal: "Personal Leave",
// // //       maternity: "Maternity Leave",
// // //       paternity: "Paternity Leave",
// // //       casual: "Casual Leave",
// // //       earned: "Earned Leave",
// // //       study: "Study Leave",
// // //     };
// // //     return map[type] || type;
// // //   };

// // //   const formatDate = (date) => date.toISOString().slice(0, 10);

// // //   const addDays = (date, days) => {
// // //     const result = new Date(date);
// // //     result.setDate(result.getDate() + days);
// // //     return result;
// // //   };

// // //   const addMonths = (date, months) => {
// // //     const result = new Date(date);
// // //     result.setMonth(result.getMonth() + months);
// // //     return result;
// // //   };

// // //   const getAutoDatesForLeaveType = (type) => {
// // //     const today = new Date();
// // //     if (type === "Paternity Leave") {
// // //       return { startDate: formatDate(today), endDate: formatDate(addDays(today, 5)) };
// // //     }
// // //     if (type === "Maternity Leave") {
// // //       return { startDate: formatDate(today), endDate: formatDate(addMonths(today, 6)) };
// // //     }
// // //     return {};
// // //   };

// // //   const updateEndDateAutomatically = (startDate, leaveType) => {
// // //     if (!startDate || !leaveType) return;
// // //     const start = new Date(startDate);
// // //     let newEndDate;
// // //     if (leaveType === "Paternity Leave") newEndDate = formatDate(addDays(start, 5));
// // //     else if (leaveType === "Maternity Leave") newEndDate = formatDate(addMonths(start, 6));
// // //     else return;
// // //     setNewLeave((prev) => ({ ...prev, endDate: newEndDate }));
// // //   };

// // //   const mapLeave = (l) => ({
// // //     id: l._id,
// // //     employeeId: l.employee?.employeeId || "",
// // //     employeeName: l.employee?.name || "",
// // //     profileImage: l.employee?.profileImage || "",
// // //     avatar: l.employee?.avatar || "",
// // //     leaveType: toFrontendType(l.type),
// // //     startDate: l.startDate,
// // //     endDate: l.endDate,
// // //     duration: l.days,
// // //     leaveBalance: l.employee?.leaveBalance ?? null,
// // //     reason: l.reason,
// // //     status: l.status,
// // //     appliedDate: l.createdAt,
// // //   });

// // //   const fetchLeaves = async () => {
// // //     try {
// // //       const res = await axios.get(`${API_BASE}/api/leave`, {
// // //         headers: { Authorization: `Bearer ${token}` },
// // //       });
// // //       const items = Array.isArray(res.data?.data) ? res.data.data : [];
// // //       setLeaveRequests(items.map(mapLeave));
// // //     } catch (err) {
// // //       console.error(err);
// // //       toast.error(err.response?.data?.message || "Failed to load leave requests");
// // //     }
// // //   };

// // //   const fetchCurrentEmployee = async () => {
// // //     if (!token || !userId) return;
// // //     setBalanceLoading(true);
// // //     try {
// // //       const res = await axios.get(`${API_BASE}/api/employees/${userId}`, {
// // //         headers: { Authorization: `Bearer ${token}` },
// // //       });
// // //       setCurrentLeaveBalance(res.data?.data?.leaveBalance ?? null);
// // //     } catch (err) {
// // //       console.error(err);
// // //     } finally {
// // //       setBalanceLoading(false);
// // //     }
// // //   };

// // //   useEffect(() => {
// // //     if (token) {
// // //       fetchLeaves();
// // //       fetchCurrentEmployee();
// // //     }
// // //   }, [token, userId]);

// // //   const calculateDuration = (startDate, endDate, isHalfDay) => {
// // //     if (!startDate || !endDate) return 0;
// // //     if (isHalfDay) return 0.5;
// // //     const start = new Date(startDate);
// // //     const end = new Date(endDate);
// // //     if (start > end) return 0;
// // //     const diffTime = Math.abs(end - start);
// // //     return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
// // //   };

// // //   const duration = calculateDuration(newLeave.startDate, newLeave.endDate, newLeave.isHalfDay);
// // //   const leaveDays = duration;

// // //   const isSpecialLeave = ["Maternity Leave", "Paternity Leave"].includes(newLeave.leaveType);
// // //   const isRestrictedLeave = ["Sick Leave", "Personal Leave"].includes(newLeave.leaveType);

// // //   const projectedRemaining = currentLeaveBalance != null ? currentLeaveBalance - leaveDays : null;

// // //   const formatDays = (days) => {
// // //     if (days == null) return "—";
// // //     return Number.isInteger(days) ? days : days.toFixed(1);
// // //   };

// // //   const normalRequests = leaveRequests.filter(
// // //     (r) => !["Maternity Leave", "Paternity Leave"].includes(r.leaveType)
// // //   );
// // //   const pendingRequests = normalRequests.filter((r) => r.status === "pending").length;
// // //   const approvedRequests = normalRequests.filter((r) => r.status === "approved").length;
// // //   const totalRequests = normalRequests.length;

// // //   const handleAddLeave = async () => {
// // //     if (!newLeave.leaveType || !newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
// // //       toast.error("Please fill in all required fields");
// // //       return;
// // //     }

// // //     if (newLeave.isHalfDay && newLeave.startDate !== newLeave.endDate) {
// // //       toast.error("Half Day leave can only be applied for the same day");
// // //       return;
// // //     }

// // //     if (isRestrictedLeave) {
// // //       const used = newLeave.leaveType === "Sick Leave" ? sickUsed : personalUsed;
// // //       const remaining = maxSickPersonal - used;

// // //       if (used >= maxSickPersonal) {
// // //         toast.error(`You have already used maximum ${maxSickPersonal} ${newLeave.leaveType}.`);
// // //         return;
// // //       }
// // //       if (leaveDays > remaining) {
// // //         toast.error(`You can only take ${remaining} more day(s) of ${newLeave.leaveType}.`);
// // //         return;
// // //       }
// // //     }

// // //     if (!isSpecialLeave && projectedRemaining !== null && projectedRemaining < 0) {
// // //       toast.error(`Insufficient leave balance! You only have ${formatDays(currentLeaveBalance)} day(s) left.`);
// // //       return;
// // //     }

// // //     try {
// // //       const payload = {
// // //         type: newLeave.isHalfDay ? "half_day" : toBackendType(newLeave.leaveType),
// // //         startDate: newLeave.startDate,
// // //         endDate: newLeave.endDate,
// // //         reason: newLeave.reason,
// // //       };

// // //       await axios.post(`${API_BASE}/api/leave`, payload, {
// // //         headers: { Authorization: `Bearer ${token}` },
// // //       });

// // //       setNewLeave({
// // //         leaveType: "",
// // //         startDate: "",
// // //         endDate: "",
// // //         reason: "",
// // //         isHalfDay: false,
// // //       });
// // //       setShowAddDialog(false);

// // //       await fetchLeaves();
// // //       await fetchCurrentEmployee();
// // //       toast.success("Leave request submitted successfully!");

// // //       postActivity({
// // //         token,
// // //         actor: user?.id || user?._id,
// // //         action: "Submitted leave request",
// // //         type: "leave",
// // //         meta: { ...payload, isHalfDay: newLeave.isHalfDay },
// // //       });
// // //     } catch (err) {
// // //       console.error(err);
// // //       toast.error(err.response?.data?.message || "Failed to submit leave request");
// // //     }
// // //   };

// // //   const handleApproveReject = async (id, status) => {
// // //     try {
// // //       await axios.patch(`${API_BASE}/api/leave/${id}/review`, { status }, {
// // //         headers: { Authorization: `Bearer ${token}` },
// // //       });
// // //       await fetchLeaves();
// // //       await fetchCurrentEmployee();
// // //       toast.success(`Leave request ${status} successfully!`);
// // //     } catch (err) {
// // //       toast.error(err.response?.data?.message || "Failed to update request");
// // //     }
// // //   };

// // //   const handleCancel = async (id) => {
// // //     try {
// // //       await axios.delete(`${API_BASE}/api/leave/${id}`, {
// // //         headers: { Authorization: `Bearer ${token}` },
// // //       });
// // //       setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
// // //       await fetchCurrentEmployee();
// // //       toast.success("Leave request cancelled");
// // //     } catch (err) {
// // //       toast.error(err.response?.data?.message || "Failed to cancel request");
// // //     }
// // //   };

// // //   const getStatusBadge = (status) => {
// // //     const variants = {
// // //       pending: { variant: "secondary", label: "Pending", icon: Clock },
// // //       approved: { variant: "default", label: "Approved", icon: Check },
// // //       rejected: { variant: "destructive", label: "Rejected", icon: X },
// // //     };
// // //     const config = variants[status] || variants.pending;
// // //     const Icon = config.icon;
// // //     return (
// // //       <Badge variant={config.variant} className="flex items-center gap-1">
// // //         <Icon className="w-3 h-3" />
// // //         {config.label}
// // //       </Badge>
// // //     );
// // //   };

// // //   const filteredRequests = leaveRequests.filter((request) => {
// // //     const matchesSearch =
// // //       request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //       request.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
// // //     const matchesStatus = filterStatus === "all" || request.status === filterStatus;
// // //     return matchesSearch && matchesStatus;
// // //   });

// // //   return (
// // //     <div className="container mx-auto p-6 space-y-6">
// // //       {/* Header */}
// // //       <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
// // //         <div>
// // //           <h1 className="text-3xl font-bold text-foreground">Leave Requests</h1>
// // //           <p className="text-muted-foreground">
// // //             {isHR ? "Manage employee leave requests" : "Submit and track your leave requests"}
// // //           </p>
// // //         </div>

// // //         {!isHR && (
// // //           <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
// // //             <DialogTrigger asChild>
// // //               <Button className="btn-gradient w-60">
// // //                 <Plus className="w-5 h-4 mr-2" />
// // //                 Request Leave
// // //               </Button>
// // //             </DialogTrigger>

// // //             <DialogContent style={{ maxHeight: "90vh", overflowY: "auto" }}>
// // //               <DialogHeader>
// // //                 <DialogTitle>Submit Leave Request</DialogTitle>
// // //                 <DialogDescription>Fill in the details for your leave request</DialogDescription>
// // //               </DialogHeader>

// // //               <div className="space-y-4">
// // //                 <div>
// // //                   <Label htmlFor="leaveType">Leave Type</Label>
// // //                   <Select
// // //                     value={newLeave.leaveType}
// // //                     onValueChange={(value) => {
// // //                       const autoDates = getAutoDatesForLeaveType(value);
// // //                       setNewLeave({
// // //                         ...newLeave,
// // //                         leaveType: value,
// // //                         ...autoDates,
// // //                         isHalfDay: false,
// // //                       });
// // //                     }}
// // //                   >
// // //                     <SelectTrigger>
// // //                       <SelectValue placeholder="Select leave type" />
// // //                     </SelectTrigger>
// // //                     <SelectContent>
// // //                       {leaveTypeOptions.map((item) => (
// // //                         <SelectItem key={item.value} value={item.value}>
// // //                           {item.label}
// // //                         </SelectItem>
// // //                       ))}
// // //                     </SelectContent>
// // //                   </Select>
// // //                 </div>

// // //                 {newLeave.leaveType && (
// // //                   <div className="flex items-center space-x-2">
// // //                     <input
// // //                       type="checkbox"
// // //                       id="isHalfDay"
// // //                       checked={newLeave.isHalfDay}
// // //                       onChange={(e) => {
// // //                         const isHalf = e.target.checked;
// // //                         setNewLeave((prev) => ({
// // //                           ...prev,
// // //                           isHalfDay: isHalf,
// // //                           endDate: isHalf ? prev.startDate : prev.endDate,
// // //                         }));
// // //                       }}
// // //                       className="w-4 h-4 accent-primary"
// // //                     />
// // //                     <Label htmlFor="isHalfDay" className="cursor-pointer">Half Day Leave</Label>
// // //                   </div>
// // //                 )}

// // //                 <div>
// // //                   <Label htmlFor="startDate">Start Date</Label>
// // //                   <Input
// // //                     id="startDate"
// // //                     type="date"
// // //                     value={newLeave.startDate}
// // //                     onChange={(e) => {
// // //                       const newStart = e.target.value;
// // //                       setNewLeave((prev) => ({
// // //                         ...prev,
// // //                         startDate: newStart,
// // //                         endDate: prev.isHalfDay ? newStart : prev.endDate,
// // //                       }));
// // //                       updateEndDateAutomatically(newStart, newLeave.leaveType);
// // //                     }}
// // //                   />
// // //                 </div>

// // //                 <div>
// // //                   <Label htmlFor="endDate">End Date</Label>
// // //                   <Input
// // //                     id="endDate"
// // //                     type="date"
// // //                     value={newLeave.endDate}
// // //                     onChange={(e) => setNewLeave((prev) => ({ ...prev, endDate: e.target.value }))}
// // //                     disabled={newLeave.isHalfDay}
// // //                   />
// // //                 </div>

// // //                 {newLeave.startDate && newLeave.endDate && (
// // //                   <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
// // //                     <p className="text-green-700 dark:text-green-400 font-semibold text-lg">
// // //                       Duration: <span className="text-3xl font-bold">{formatDays(leaveDays)}</span> day(s)
// // //                     </p>
// // //                   </div>
// // //                 )}

// // //                 {isRestrictedLeave && (
// // //                   <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
// // //                     <p className="text-blue-700 dark:text-blue-400 font-medium">
// // //                       {newLeave.leaveType}: {newLeave.leaveType === "Sick Leave" ? sickUsed : personalUsed} / 2 used
// // //                     </p>
// // //                   </div>
// // //                 )}

// // //                 {currentLeaveBalance != null && (
// // //                   <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
// // //                     <div className="flex items-center justify-between gap-4 mb-2">
// // //                       <p className="text-sm text-muted-foreground">Remaining leave balance</p>
// // //                       {balanceLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
// // //                     </div>
// // //                     <p className="text-2xl font-semibold">{formatDays(currentLeaveBalance)} day(s)</p>

// // //                     {!isSpecialLeave && projectedRemaining !== null && (
// // //                       <p className={`mt-2 text-sm font-medium ${projectedRemaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
// // //                         {projectedRemaining < 0
// // //                           ? `Insufficient balance! You only have ${formatDays(currentLeaveBalance)} day(s)`
// // //                           : `After this request: ${formatDays(projectedRemaining)} day(s) remaining`}
// // //                       </p>
// // //                     )}
// // //                   </div>
// // //                 )}

// // //                 <div>
// // //                   <Label htmlFor="reason">Reason</Label>
// // //                   <Textarea
// // //                     id="reason"
// // //                     placeholder="Please provide a reason for your leave..."
// // //                     value={newLeave.reason}
// // //                     onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
// // //                     rows={4}
// // //                   />
// // //                 </div>
// // //               </div>

// // //               <div className="flex justify-end space-x-3 pt-4">
// // //                 <Button variant="outline" onClick={() => setShowAddDialog(false)}>
// // //                   Cancel
// // //                 </Button>
// // //                 <Button onClick={handleAddLeave} className="btn-gradient">
// // //                   Submit Request
// // //                 </Button>
// // //               </div>
// // //             </DialogContent>
// // //           </Dialog>
// // //         )}
// // //       </div>

// // //       {/* Stats Cards */}
// // //       <div className="flex flex-wrap gap-4 mb-5">
// // //         {isHR ? (
// // //           <>
// // //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// // //               <Card className="dashboard-card">
// // //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // //                   <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
// // //                   <FileText className="h-4 w-4 text-muted-foreground" />
// // //                 </CardHeader>
// // //                 <CardContent>
// // //                   <div className="text-2xl font-bold">{totalRequests}</div>
// // //                   <p className="text-xs text-muted-foreground">This month</p>
// // //                 </CardContent>
// // //               </Card>
// // //             </div>

// // //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// // //               <Card className="dashboard-card">
// // //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // //                   <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
// // //                   <Clock className="h-4 w-4 text-muted-foreground" />
// // //                 </CardHeader>
// // //                 <CardContent>
// // //                   <div className="text-2xl font-bold">{pendingRequests}</div>
// // //                   <p className="text-xs text-muted-foreground">Require your attention</p>
// // //                 </CardContent>
// // //               </Card>
// // //             </div>

// // //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// // //               <Card className="dashboard-card">
// // //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // //                   <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
// // //                   <Check className="h-4 w-4 text-muted-foreground" />
// // //                 </CardHeader>
// // //                 <CardContent>
// // //                   <div className="text-2xl font-bold">{approvedRequests}</div>
// // //                   <p className="text-xs text-muted-foreground">This month</p>
// // //                 </CardContent>
// // //               </Card>
// // //             </div>
// // //           </>
// // //         ) : (
// // //           <>
// // //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// // //               <Card className="dashboard-card">
// // //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // //                   <CardTitle className="text-sm font-medium">Remaining Leave Balance</CardTitle>
// // //                   <UserCheck className="h-4 w-4 text-muted-foreground" />
// // //                 </CardHeader>
// // //                 <CardContent>
// // //                   <div className="text-2xl font-bold">
// // //                     {balanceLoading ? "..." : formatDays(currentLeaveBalance)}
// // //                   </div>
// // //                   <p className="text-xs text-muted-foreground">available to use</p>
// // //                 </CardContent>
// // //               </Card>
// // //             </div>

// // //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// // //               <Card className="dashboard-card">
// // //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // //                   <CardTitle className="text-sm font-medium">Sick Leave</CardTitle>
// // //                   <Clock className="h-4 w-4 text-muted-foreground" />
// // //                 </CardHeader>
// // //                 <CardContent>
// // //                   <div className="text-2xl font-bold">{sickUsed} / 2</div>
// // //                   <p className="text-xs text-muted-foreground">used</p>
// // //                 </CardContent>
// // //               </Card>
// // //             </div>

// // //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// // //               <Card className="dashboard-card">
// // //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // //                   <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
// // //                   <Clock className="h-4 w-4 text-muted-foreground" />
// // //                 </CardHeader>
// // //                 <CardContent>
// // //                   <div className="text-2xl font-bold">{pendingRequests}</div>
// // //                   <p className="text-xs text-muted-foreground">Awaiting approval</p>
// // //                 </CardContent>
// // //               </Card>
// // //             </div>
// // //           </>
// // //         )}
// // //       </div>

// // //       {/* Filters */}
// // //       <Card className="dashboard-card">
// // //         <CardContent className="pt-6">
// // //           <div className="flex flex-wrap items-center gap-4 mb-5">
// // //             <div className="relative flex-1 min-w-full sm:min-w-[250px] md:min-w-[300px]">
// // //               <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
// // //               <Input
// // //                 placeholder="Search by employee name or ID..."
// // //                 value={searchTerm}
// // //                 onChange={(e) => setSearchTerm(e.target.value)}
// // //                 className="pl-10"
// // //               />
// // //             </div>
// // //             <div className="flex-1 min-w-full sm:min-w-[220px]">
// // //               <Select value={filterStatus} onValueChange={setFilterStatus}>
// // //                 <SelectTrigger>
// // //                   <Filter className="w-4 h-4 mr-2" />
// // //                   <SelectValue />
// // //                 </SelectTrigger>
// // //                 <SelectContent>
// // //                   {statusOptions.map((status) => (
// // //                     <SelectItem key={status} value={status}>
// // //                       {status === "all" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
// // //                     </SelectItem>
// // //                   ))}
// // //                 </SelectContent>
// // //               </Select>
// // //             </div>
// // //           </div>
// // //         </CardContent>
// // //       </Card>

// // //       {/* Leave Requests Table */}
// // //       <Card className="data-table">
// // //         <Table>
// // //           <TableHeader>
// // //             <TableRow>
// // //               <TableHead>Employee</TableHead>
// // //               <TableHead>Leave Type</TableHead>
// // //               <TableHead>Start Date</TableHead>
// // //               <TableHead>End Date</TableHead>
// // //               <TableHead>Duration</TableHead>
// // //               <TableHead>Balance</TableHead>
// // //               <TableHead>Status</TableHead>
// // //               <TableHead>Applied Date</TableHead>
// // //               <TableHead>Actions</TableHead>
// // //             </TableRow>
// // //           </TableHeader>
// // //           <TableBody>
// // //             {filteredRequests.map((request) => (
// // //               <TableRow key={request.id}>
// // //                 <TableCell>
// // //                   <div className="flex items-center space-x-3">
// // //                     <Avatar className="w-8 h-8">
// // //                       <AvatarImage
// // //                         src={
// // //                           request.profileImage ||
// // //                           request.avatar ||
// // //                           `https://ui-avatars.com/api/?name=${encodeURIComponent(request.employeeName)}&background=0D8ABC&color=fff`
// // //                         }
// // //                         alt={request.employeeName}
// // //                       />
// // //                       <AvatarFallback>
// // //                         {request.employeeName.split(" ").map((n) => n[0]).join("")}
// // //                       </AvatarFallback>
// // //                     </Avatar>
// // //                     <div>
// // //                       <p className="font-medium">{request.employeeName}</p>
// // //                       <p className="text-sm text-muted-foreground">{request.employeeId}</p>
// // //                     </div>
// // //                   </div>
// // //                 </TableCell>
// // //                 <TableCell>{request.leaveType}</TableCell>
// // //                 <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
// // //                 <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
// // //                 <TableCell>{request.duration} day(s)</TableCell>
// // //                 <TableCell>
// // //                   {request.leaveBalance != null ? `${request.leaveBalance} day(s)` : "—"}
// // //                 </TableCell>
// // //                 <TableCell>{getStatusBadge(request.status)}</TableCell>
// // //                 <TableCell>{new Date(request.appliedDate).toLocaleDateString()}</TableCell>
// // //                 <TableCell>
// // //                   <div className="flex space-x-2">
// // //                     {isHR && request.status === "pending" && (
// // //                       <>
// // //                         <Button
// // //                           variant="ghost"
// // //                           size="sm"
// // //                           className="text-green-600 hover:text-green-700"
// // //                           onClick={() => handleApproveReject(request.id, "approved")}
// // //                         >
// // //                           <Check className="w-4 h-4" />
// // //                         </Button>
// // //                         <Button
// // //                           variant="ghost"
// // //                           size="sm"
// // //                           className="text-destructive hover:text-destructive"
// // //                           onClick={() => handleApproveReject(request.id, "rejected")}
// // //                         >
// // //                           <X className="w-4 h-4" />
// // //                         </Button>
// // //                       </>
// // //                     )}
// // //                     {!isHR &&
// // //                       request.status === "pending" &&
// // //                       request.employeeId === (user?.employeeId || "") && (
// // //                         <Button
// // //                           variant="ghost"
// // //                           size="sm"
// // //                           className="text-destructive hover:text-destructive"
// // //                           onClick={() => handleCancel(request.id)}
// // //                         >
// // //                           <X className="w-4 h-4" /> Cancel
// // //                         </Button>
// // //                       )}
// // //                   </div>
// // //                 </TableCell>
// // //               </TableRow>
// // //             ))}
// // //           </TableBody>
// // //         </Table>
// // //       </Card>

// // //       {filteredRequests.length === 0 && (
// // //         <div className="text-center py-12">
// // //           <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
// // //           <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
// // //           <p className="text-muted-foreground">Try adjusting your search or filters</p>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default LeaveRequests;

// // import { useEffect, useState } from "react";
// // import { useAuth } from "../contexts/AuthContext";
// // import { Button } from "../components/ui/button";
// // import { Input } from "../components/ui/input";
// // import {
// //   Card,
// //   CardContent,
// //   CardDescription,
// //   CardHeader,
// //   CardTitle,
// // } from "../components/ui/card";
// // import { Badge } from "../components/ui/badge";
// // import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "../components/ui/select";
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogDescription,
// //   DialogHeader,
// //   DialogTitle,
// //   DialogTrigger,
// // } from "../components/ui/dialog";
// // import { Label } from "../components/ui/label";
// // import { Textarea } from "../components/ui/textarea";
// // import {
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "../components/ui/table";
// // import {
// //   Search,
// //   Plus,
// //   Filter,
// //   Check,
// //   X,
// //   Calendar,
// //   Clock,
// //   FileText,
// //   UserCheck,
// // } from "lucide-react";
// // import { toast } from "react-toastify";
// // import axios from "axios";
// // import { postActivity } from "../lib/postActivity";

// // const API_URL = import.meta.env.VITE_API_URL;

// // const LeaveRequests = () => {
// //   const { isHR, user } = useAuth();
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filterStatus, setFilterStatus] = useState("all");
// //   const [showAddDialog, setShowAddDialog] = useState(false);
// //   const [showGrantDialog, setShowGrantDialog] = useState(false);

// //   const API_BASE = API_URL;
// //   const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
// //   const userId = user?.id || user?._id;

// //   const [leaveRequests, setLeaveRequests] = useState([]);
// //   const [currentLeaveBalance, setCurrentLeaveBalance] = useState(null);
// //   const [balanceLoading, setBalanceLoading] = useState(false);
// //   const [employees, setEmployees] = useState([]);

// //   const [newLeave, setNewLeave] = useState({
// //     leaveType: "",
// //     startDate: "",
// //     endDate: "",
// //     reason: "",
// //     isHalfDay: false,
// //   });

// //   const [grantLeave, setGrantLeave] = useState({
// //     employeeId: "",
// //     leaveType: "Compensatory Leave",
// //     days: 1,
// //     reason: "",
// //   });

// //   const statusOptions = ["all", "pending", "approved", "rejected"];
// //   const maxSickPersonal = 2;

// //   // Calculate used leaves
// //   const sickUsed = leaveRequests.filter(r => r.leaveType === "Sick Leave" && r.status === "approved").length;
// //   const personalUsed = leaveRequests.filter(r => r.leaveType === "Personal Leave" && r.status === "approved").length;

// //   const leaveTypeOptions = [
// //     { value: "Annual Leave", label: "Annual Leave" },
// //     { value: "Sick Leave", label: `Sick Leave (${sickUsed}/${maxSickPersonal})` },
// //     { value: "Personal Leave", label: `Personal Leave (${personalUsed}/${maxSickPersonal})` },
// //     { value: "Maternity Leave", label: "Maternity Leave" },
// //     { value: "Paternity Leave", label: "Paternity Leave" },
// //     { value: "Casual Leave", label: "Casual Leave" },
// //     { value: "Earned Leave", label: "Earned Leave" },
// //     { value: "Study Leave", label: "Study Leave" },
// //     { value: "Compensatory Leave", label: "Compensatory Leave" },
// //   ];

// //   const toBackendType = (type) => {
// //     const map = {
// //       "Annual Leave": "vacation",
// //       "Sick Leave": "sick",
// //       "Personal Leave": "personal",
// //       "Maternity Leave": "maternity",
// //       "Paternity Leave": "paternity",
// //       "Casual Leave": "casual",
// //       "Earned Leave": "earned",
// //       "Study Leave": "study",
// //       "Compensatory Leave": "compensatory",
// //     };
// //     return map[type] || "personal";
// //   };

// //   const toFrontendType = (type) => {
// //     const map = {
// //       vacation: "Annual Leave",
// //       sick: "Sick Leave",
// //       personal: "Personal Leave",
// //       maternity: "Maternity Leave",
// //       paternity: "Paternity Leave",
// //       casual: "Casual Leave",
// //       earned: "Earned Leave",
// //       study: "Study Leave",
// //       compensatory: "Compensatory Leave",
// //     };
// //     return map[type] || type;
// //   };

// //   const formatDate = (date) => date.toISOString().slice(0, 10);

// //   const addDays = (date, days) => {
// //     const result = new Date(date);
// //     result.setDate(result.getDate() + days);
// //     return result;
// //   };

// //   const addMonths = (date, months) => {
// //     const result = new Date(date);
// //     result.setMonth(result.getMonth() + months);
// //     return result;
// //   };

// //   const getAutoDatesForLeaveType = (type) => {
// //     const today = new Date();
// //     if (type === "Paternity Leave") {
// //       return { startDate: formatDate(today), endDate: formatDate(addDays(today, 5)) };
// //     }
// //     if (type === "Maternity Leave") {
// //       return { startDate: formatDate(today), endDate: formatDate(addMonths(today, 6)) };
// //     }
// //     return {};
// //   };

// //   const updateEndDateAutomatically = (startDate, leaveType) => {
// //     if (!startDate || !leaveType) return;
// //     const start = new Date(startDate);
// //     let newEndDate;
// //     if (leaveType === "Paternity Leave") newEndDate = formatDate(addDays(start, 5));
// //     else if (leaveType === "Maternity Leave") newEndDate = formatDate(addMonths(start, 6));
// //     else return;
// //     setNewLeave((prev) => ({ ...prev, endDate: newEndDate }));
// //   };

// //   const mapLeave = (l) => ({
// //     id: l._id,
// //     employeeId: l.employee?.employeeId || "",
// //     employeeName: l.employee?.name || "",
// //     profileImage: l.employee?.profileImage || "",
// //     avatar: l.employee?.avatar || "",
// //     leaveType: toFrontendType(l.type),
// //     startDate: l.startDate,
// //     endDate: l.endDate,
// //     duration: l.days,
// //     leaveBalance: l.employee?.leaveBalance ?? null,
// //     reason: l.reason,
// //     status: l.status,
// //     appliedDate: l.createdAt,
// //   });

// //   const fetchLeaves = async () => {
// //     try {
// //       const res = await axios.get(`${API_BASE}/api/leave`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       const items = Array.isArray(res.data?.data) ? res.data.data : [];
// //       setLeaveRequests(items.map(mapLeave));
// //     } catch (err) {
// //       console.error(err);
// //       toast.error(err.response?.data?.message || "Failed to load leave requests");
// //     }
// //   };

// //   const fetchCurrentEmployee = async () => {
// //     if (!token || !userId) return;
// //     setBalanceLoading(true);
// //     try {
// //       const res = await axios.get(`${API_BASE}/api/employees/${userId}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       setCurrentLeaveBalance(res.data?.data?.leaveBalance ?? null);
// //     } catch (err) {
// //       console.error(err);
// //     } finally {
// //       setBalanceLoading(false);
// //     }
// //   };

// //   const fetchEmployees = async () => {
// //     if (!isHR) return;
// //     try {
// //       const res = await axios.get(`${API_BASE}/api/employees`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       setEmployees(res.data?.data || []);
// //     } catch (err) {
// //       console.error(err);
// //       toast.error("Failed to load employees");
// //     }
// //   };

// //   useEffect(() => {
// //     if (token) {
// //       fetchLeaves();
// //       fetchCurrentEmployee();
// //       if (isHR) fetchEmployees();
// //     }
// //   }, [token, userId, isHR]);

// //   const calculateDuration = (startDate, endDate, isHalfDay) => {
// //     if (!startDate || !endDate) return 0;
// //     if (isHalfDay) return 0.5;
// //     const start = new Date(startDate);
// //     const end = new Date(endDate);
// //     if (start > end) return 0;
// //     const diffTime = Math.abs(end - start);
// //     return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
// //   };

// //   const duration = calculateDuration(newLeave.startDate, newLeave.endDate, newLeave.isHalfDay);
// //   const leaveDays = duration;

// //   const isSpecialLeave = ["Maternity Leave", "Paternity Leave"].includes(newLeave.leaveType);
// //   const isRestrictedLeave = ["Sick Leave", "Personal Leave"].includes(newLeave.leaveType);

// //   const projectedRemaining = currentLeaveBalance != null ? currentLeaveBalance - leaveDays : null;

// //   const formatDays = (days) => {
// //     if (days == null) return "—";
// //     return Number.isInteger(days) ? days : days.toFixed(1);
// //   };

// //   const normalRequests = leaveRequests.filter(
// //     (r) => !["Maternity Leave", "Paternity Leave"].includes(r.leaveType)
// //   );
// //   const pendingRequests = normalRequests.filter((r) => r.status === "pending").length;
// //   const approvedRequests = normalRequests.filter((r) => r.status === "approved").length;
// //   const totalRequests = normalRequests.length;

// //   const handleAddLeave = async () => {
// //     if (!newLeave.leaveType || !newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
// //       toast.error("Please fill in all required fields");
// //       return;
// //     }

// //     if (newLeave.isHalfDay && newLeave.startDate !== newLeave.endDate) {
// //       toast.error("Half Day leave can only be applied for the same day");
// //       return;
// //     }

// //     if (isRestrictedLeave) {
// //       const used = newLeave.leaveType === "Sick Leave" ? sickUsed : personalUsed;
// //       const remaining = maxSickPersonal - used;

// //       if (used >= maxSickPersonal) {
// //         toast.error(`You have already used maximum ${maxSickPersonal} ${newLeave.leaveType}.`);
// //         return;
// //       }
// //       if (leaveDays > remaining) {
// //         toast.error(`You can only take ${remaining} more day(s) of ${newLeave.leaveType}.`);
// //         return;
// //       }
// //     }

// //     if (!isSpecialLeave && projectedRemaining !== null && projectedRemaining < 0) {
// //       toast.error(`Insufficient leave balance! You only have ${formatDays(currentLeaveBalance)} day(s) left.`);
// //       return;
// //     }

// //     try {
// //       const payload = {
// //         type: newLeave.isHalfDay ? "half_day" : toBackendType(newLeave.leaveType),
// //         startDate: newLeave.startDate,
// //         endDate: newLeave.endDate,
// //         reason: newLeave.reason,
// //       };

// //       await axios.post(`${API_BASE}/api/leave`, payload, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       setNewLeave({
// //         leaveType: "",
// //         startDate: "",
// //         endDate: "",
// //         reason: "",
// //         isHalfDay: false,
// //       });
// //       setShowAddDialog(false);

// //       await fetchLeaves();
// //       await fetchCurrentEmployee();
// //       toast.success("Leave request submitted successfully!");

// //       postActivity({
// //         token,
// //         actor: user?.id || user?._id,
// //         action: "Submitted leave request",
// //         type: "leave",
// //         meta: { ...payload, isHalfDay: newLeave.isHalfDay },
// //       });
// //     } catch (err) {
// //       console.error(err);
// //       toast.error(err.response?.data?.message || "Failed to submit leave request");
// //     }
// //   };

// //   const handleGrantLeave = async () => {
// //     if (!grantLeave.employeeId || !grantLeave.days || !grantLeave.reason) {
// //       toast.error("Please fill all required fields");
// //       return;
// //     }

// //     try {
// //       await axios.post(`${API_BASE}/api/employees/${grantLeave.employeeId}/grant-leave`, {
// //         days: Number(grantLeave.days),
// //         type: toBackendType(grantLeave.leaveType),
// //         reason: grantLeave.reason,
// //       }, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       toast.success("Leave granted successfully!");
// //       setShowGrantDialog(false);

// //       setGrantLeave({
// //         employeeId: "",
// //         leaveType: "Compensatory Leave",
// //         days: 1,
// //         reason: "",
// //       });

// //       await fetchLeaves();
// //       await fetchCurrentEmployee();
// //     } catch (err) {
// //       console.error(err);
// //       toast.error(err.response?.data?.message || "Failed to grant leave");
// //     }
// //   };

// //   const handleApproveReject = async (id, status) => {
// //     try {
// //       await axios.patch(`${API_BASE}/api/leave/${id}/review`, { status }, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       await fetchLeaves();
// //       await fetchCurrentEmployee();
// //       toast.success(`Leave request ${status} successfully!`);
// //     } catch (err) {
// //       toast.error(err.response?.data?.message || "Failed to update request");
// //     }
// //   };

// //   const handleCancel = async (id) => {
// //     try {
// //       await axios.delete(`${API_BASE}/api/leave/${id}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
// //       await fetchCurrentEmployee();
// //       toast.success("Leave request cancelled");
// //     } catch (err) {
// //       toast.error(err.response?.data?.message || "Failed to cancel request");
// //     }
// //   };

// //   const getStatusBadge = (status) => {
// //     const variants = {
// //       pending: { variant: "secondary", label: "Pending", icon: Clock },
// //       approved: { variant: "default", label: "Approved", icon: Check },
// //       rejected: { variant: "destructive", label: "Rejected", icon: X },
// //     };
// //     const config = variants[status] || variants.pending;
// //     const Icon = config.icon;
// //     return (
// //       <Badge variant={config.variant} className="flex items-center gap-1">
// //         <Icon className="w-3 h-3" />
// //         {config.label}
// //       </Badge>
// //     );
// //   };

// //   const filteredRequests = leaveRequests.filter((request) => {
// //     const matchesSearch =
// //       request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       request.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
// //     const matchesStatus = filterStatus === "all" || request.status === filterStatus;
// //     return matchesSearch && matchesStatus;
// //   });

// //   return (
// //     <div className="container mx-auto p-6 space-y-6">
// //       {/* Header */}
// //       <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
// //         <div>
// //           <h1 className="text-3xl font-bold text-foreground">Leave Requests</h1>
// //           <p className="text-muted-foreground">
// //             {isHR ? "Manage employee leave requests" : "Submit and track your leave requests"}
// //           </p>
// //         </div>

// //         <div className="flex gap-3">
// //           {!isHR && (
// //             <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
// //               <DialogTrigger asChild>
// //                 <Button className="btn-gradient w-60">
// //                   <Plus className="w-5 h-4 mr-2" />
// //                   Request Leave
// //                 </Button>
// //               </DialogTrigger>

// //               <DialogContent style={{ maxHeight: "90vh", overflowY: "auto" }}>
// //                 <DialogHeader>
// //                   <DialogTitle>Submit Leave Request</DialogTitle>
// //                   <DialogDescription>Fill in the details for your leave request</DialogDescription>
// //                 </DialogHeader>

// //                 <div className="space-y-4">
// //                   <div>
// //                     <Label htmlFor="leaveType">Leave Type</Label>
// //                     <Select
// //                       value={newLeave.leaveType}
// //                       onValueChange={(value) => {
// //                         const autoDates = getAutoDatesForLeaveType(value);
// //                         setNewLeave({
// //                           ...newLeave,
// //                           leaveType: value,
// //                           ...autoDates,
// //                           isHalfDay: false,
// //                         });
// //                       }}
// //                     >
// //                       <SelectTrigger>
// //                         <SelectValue placeholder="Select leave type" />
// //                       </SelectTrigger>
// //                       <SelectContent>
// //                         {leaveTypeOptions.map((item) => (
// //                           <SelectItem key={item.value} value={item.value}>
// //                             {item.label}
// //                           </SelectItem>
// //                         ))}
// //                       </SelectContent>
// //                     </Select>
// //                   </div>

// //                   {newLeave.leaveType && (
// //                     <div className="flex items-center space-x-2">
// //                       <input
// //                         type="checkbox"
// //                         id="isHalfDay"
// //                         checked={newLeave.isHalfDay}
// //                         onChange={(e) => {
// //                           const isHalf = e.target.checked;
// //                           setNewLeave((prev) => ({
// //                             ...prev,
// //                             isHalfDay: isHalf,
// //                             endDate: isHalf ? prev.startDate : prev.endDate,
// //                           }));
// //                         }}
// //                         className="w-4 h-4 accent-primary"
// //                       />
// //                       <Label htmlFor="isHalfDay" className="cursor-pointer">Half Day Leave</Label>
// //                     </div>
// //                   )}

// //                   <div>
// //                     <Label htmlFor="startDate">Start Date</Label>
// //                     <Input
// //                       id="startDate"
// //                       type="date"
// //                       value={newLeave.startDate}
// //                       onChange={(e) => {
// //                         const newStart = e.target.value;
// //                         setNewLeave((prev) => ({
// //                           ...prev,
// //                           startDate: newStart,
// //                           endDate: prev.isHalfDay ? newStart : prev.endDate,
// //                         }));
// //                         updateEndDateAutomatically(newStart, newLeave.leaveType);
// //                       }}
// //                     />
// //                   </div>

// //                   <div>
// //                     <Label htmlFor="endDate">End Date</Label>
// //                     <Input
// //                       id="endDate"
// //                       type="date"
// //                       value={newLeave.endDate}
// //                       onChange={(e) => setNewLeave((prev) => ({ ...prev, endDate: e.target.value }))}
// //                       disabled={newLeave.isHalfDay}
// //                     />
// //                   </div>

// //                   {newLeave.startDate && newLeave.endDate && (
// //                     <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
// //                       <p className="text-green-700 dark:text-green-400 font-semibold text-lg">
// //                         Duration: <span className="text-3xl font-bold">{formatDays(leaveDays)}</span> day(s)
// //                       </p>
// //                     </div>
// //                   )}

// //                   {isRestrictedLeave && (
// //                     <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
// //                       <p className="text-blue-700 dark:text-blue-400 font-medium">
// //                         {newLeave.leaveType}: {newLeave.leaveType === "Sick Leave" ? sickUsed : personalUsed} / 2 used
// //                       </p>
// //                     </div>
// //                   )}

// //                   {currentLeaveBalance != null && (
// //                     <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
// //                       <div className="flex items-center justify-between gap-4 mb-2">
// //                         <p className="text-sm text-muted-foreground">Remaining leave balance</p>
// //                         {balanceLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
// //                       </div>
// //                       <p className="text-2xl font-semibold">{formatDays(currentLeaveBalance)} day(s)</p>

// //                       {!isSpecialLeave && projectedRemaining !== null && (
// //                         <p className={`mt-2 text-sm font-medium ${projectedRemaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
// //                           {projectedRemaining < 0
// //                             ? `Insufficient balance! You only have ${formatDays(currentLeaveBalance)} day(s)`
// //                             : `After this request: ${formatDays(projectedRemaining)} day(s) remaining`}
// //                         </p>
// //                       )}
// //                     </div>
// //                   )}

// //                   <div>
// //                     <Label htmlFor="reason">Reason</Label>
// //                     <Textarea
// //                       id="reason"
// //                       placeholder="Please provide a reason for your leave..."
// //                       value={newLeave.reason}
// //                       onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
// //                       rows={4}
// //                     />
// //                   </div>
// //                 </div>

// //                 <div className="flex justify-end space-x-3 pt-4">
// //                   <Button variant="outline" onClick={() => setShowAddDialog(false)}>
// //                     Cancel
// //                   </Button>
// //                   <Button onClick={handleAddLeave} className="btn-gradient">
// //                     Submit Request
// //                   </Button>
// //                 </div>
// //               </DialogContent>
// //             </Dialog>
// //           )}

// //         </div>
// //       </div>

// //       {/* Stats Cards */}
// //       <div className="flex flex-wrap gap-4 mb-5">
// //         {isHR ? (
// //           <>
// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
// //                   <FileText className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">{totalRequests}</div>
// //                   <p className="text-xs text-muted-foreground">This month</p>
// //                 </CardContent>
// //               </Card>
// //             </div>

// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
// //                   <Clock className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">{pendingRequests}</div>
// //                   <p className="text-xs text-muted-foreground">Require your attention</p>
// //                 </CardContent>
// //               </Card>
// //             </div>

// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
// //                   <Check className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">{approvedRequests}</div>
// //                   <p className="text-xs text-muted-foreground">This month</p>
// //                 </CardContent>
// //               </Card>
// //             </div>
// //           </>
// //         ) : (
// //           <>
// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">Remaining Leave Balance</CardTitle>
// //                   <UserCheck className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">
// //                     {balanceLoading ? "..." : formatDays(currentLeaveBalance)}
// //                   </div>
// //                   <p className="text-xs text-muted-foreground">available to use</p>
// //                 </CardContent>
// //               </Card>
// //             </div>

// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">Sick Leave</CardTitle>
// //                   <Clock className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">{sickUsed} / 2</div>
// //                   <p className="text-xs text-muted-foreground">used</p>
// //                 </CardContent>
// //               </Card>
// //             </div>

// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
// //                   <Clock className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">{pendingRequests}</div>
// //                   <p className="text-xs text-muted-foreground">Awaiting approval</p>
// //                 </CardContent>
// //               </Card>
// //             </div>
// //           </>
// //         )}
// //       </div>

// //       {/* Filters */}
// //       <Card className="dashboard-card">
// //         <CardContent className="pt-6">
// //           <div className="flex flex-wrap items-center gap-4 mb-5">
// //             <div className="relative flex-1 min-w-full sm:min-w-[250px] md:min-w-[300px]">
// //               <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
// //               <Input
// //                 placeholder="Search by employee name or ID..."
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //                 className="pl-10"
// //               />
// //             </div>
// //             <div className="flex-1 min-w-full sm:min-w-[220px]">
// //               <Select value={filterStatus} onValueChange={setFilterStatus}>
// //                 <SelectTrigger>
// //                   <Filter className="w-4 h-4 mr-2" />
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   {statusOptions.map((status) => (
// //                     <SelectItem key={status} value={status}>
// //                       {status === "all" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
// //                     </SelectItem>
// //                   ))}
// //                 </SelectContent>
// //               </Select>
// //             </div>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Grant Leave Dialog */}
// //       <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
// //         <DialogContent>
// //           <DialogHeader>
// //             <DialogTitle>Grant / Compose Leave</DialogTitle>
// //             <DialogDescription>Add leave balance to an employee</DialogDescription>
// //           </DialogHeader>

// //           <div className="space-y-4 py-4">
// //             <div>
// //               <Label htmlFor="employee">Select Employee</Label>
// //               <Select
// //                 value={grantLeave.employeeId}
// //                 onValueChange={(value) => setGrantLeave((prev) => ({ ...prev, employeeId: value }))}
// //               >
// //                 <SelectTrigger>
// //                   <SelectValue placeholder="Select employee" />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   {employees.map((emp) => (
// //                     <SelectItem key={emp._id} value={emp._id}>
// //                       {emp.name} ({emp.employeeId})
// //                     </SelectItem>
// //                   ))}
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             <div>
// //               <Label>Leave Type</Label>
// //               <Select
// //                 value={grantLeave.leaveType}
// //                 onValueChange={(value) => setGrantLeave((prev) => ({ ...prev, leaveType: value }))}
// //               >
// //                 <SelectTrigger>
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   {leaveTypeOptions.map((item) => (
// //                     <SelectItem key={item.value} value={item.value}>
// //                       {item.label}
// //                     </SelectItem>
// //                   ))}
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             <div>
// //               <Label htmlFor="days">Number of Days</Label>
// //               <Input
// //                 id="days"
// //                 type="number"
// //                 min="0.5"
// //                 step="0.5"
// //                 value={grantLeave.days}
// //                 onChange={(e) => setGrantLeave((prev) => ({ ...prev, days: e.target.value }))}
// //               />
// //             </div>

// //             <div>
// //               <Label htmlFor="reason">Reason / Remarks</Label>
// //               <Textarea
// //                 id="reason"
// //                 placeholder="Compensatory leave for extra hours / festival adjustment etc."
// //                 value={grantLeave.reason}
// //                 onChange={(e) => setGrantLeave((prev) => ({ ...prev, reason: e.target.value }))}
// //                 rows={3}
// //               />
// //             </div>
// //           </div>

// //           <div className="flex justify-end space-x-3 pt-4">
// //             <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
// //               Cancel
// //             </Button>
// //             <Button onClick={handleGrantLeave} className="btn-gradient">
// //               Grant Leave
// //             </Button>
// //           </div>
// //         </DialogContent>
// //       </Dialog>

// //       {/* Leave Requests Table */}
// //       <Card className="data-table">
// //         <Table>
// //           <TableHeader>
// //             <TableRow>
// //               <TableHead>Employee</TableHead>
// //               <TableHead>Leave Type</TableHead>
// //               <TableHead>Start Date</TableHead>
// //               <TableHead>End Date</TableHead>
// //               <TableHead>Duration</TableHead>
// //               <TableHead>Balance</TableHead>
// //               <TableHead>Status</TableHead>
// //               <TableHead>Applied Date</TableHead>
// //               <TableHead>Actions</TableHead>
// //             </TableRow>
// //           </TableHeader>
// //           <TableBody>
// //             {filteredRequests.map((request) => (
// //               <TableRow key={request.id}>
// //                 <TableCell>
// //                   <div className="flex items-center space-x-3">
// //                     <Avatar className="w-8 h-8">
// //                       <AvatarImage
// //                         src={
// //                           request.profileImage ||
// //                           request.avatar ||
// //                           `https://ui-avatars.com/api/?name=${encodeURIComponent(request.employeeName)}&background=0D8ABC&color=fff`
// //                         }
// //                         alt={request.employeeName}
// //                       />
// //                       <AvatarFallback>
// //                         {request.employeeName.split(" ").map((n) => n[0]).join("")}
// //                       </AvatarFallback>
// //                     </Avatar>
// //                     <div>
// //                       <p className="font-medium">{request.employeeName}</p>
// //                       <p className="text-sm text-muted-foreground">{request.employeeId}</p>
// //                     </div>
// //                   </div>
// //                 </TableCell>
// //                 <TableCell>{request.leaveType}</TableCell>
// //                 <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
// //                 <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
// //                 <TableCell>{request.duration} day(s)</TableCell>
// //                 <TableCell>
// //                   {request.leaveBalance != null ? `${request.leaveBalance} day(s)` : "—"}
// //                 </TableCell>
// //                 <TableCell>{getStatusBadge(request.status)}</TableCell>
// //                 <TableCell>{new Date(request.appliedDate).toLocaleDateString()}</TableCell>
// //                 <TableCell>
// //                   <div className="flex space-x-2">
// //                     {isHR && request.status === "pending" && (
// //                       <>
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           className="text-green-600 hover:text-green-700"
// //                           onClick={() => handleApproveReject(request.id, "approved")}
// //                         >
// //                           <Check className="w-4 h-4" />
// //                         </Button>
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           className="text-destructive hover:text-destructive"
// //                           onClick={() => handleApproveReject(request.id, "rejected")}
// //                         >
// //                           <X className="w-4 h-4" />
// //                         </Button>
// //                       </>
// //                     )}
// //                     {!isHR &&
// //                       request.status === "pending" &&
// //                       request.employeeId === (user?.employeeId || "") && (
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           className="text-destructive hover:text-destructive"
// //                           onClick={() => handleCancel(request.id)}
// //                         >
// //                           <X className="w-4 h-4" /> Cancel
// //                         </Button>
// //                       )}
// //                   </div>
// //                 </TableCell>
// //               </TableRow>
// //             ))}
// //           </TableBody>
// //         </Table>
// //       </Card>

// //       {filteredRequests.length === 0 && (
// //         <div className="text-center py-12">
// //           <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
// //           <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
// //           <p className="text-muted-foreground">Try adjusting your search or filters</p>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default LeaveRequests;

// // import { useEffect, useState } from "react";
// // import { useAuth } from "../contexts/AuthContext";
// // import { Button } from "../components/ui/button";
// // import { Input } from "../components/ui/input";
// // import {
// //   Card,
// //   CardContent,
// //   CardDescription,
// //   CardHeader,
// //   CardTitle,
// // } from "../components/ui/card";
// // import { Badge } from "../components/ui/badge";
// // import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "../components/ui/select";
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogDescription,
// //   DialogHeader,
// //   DialogTitle,
// //   DialogTrigger,
// // } from "../components/ui/dialog";
// // import { Label } from "../components/ui/label";
// // import { Textarea } from "../components/ui/textarea";
// // import {
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "../components/ui/table";
// // import {
// //   Search,
// //   Plus,
// //   Filter,
// //   Check,
// //   X,
// //   Calendar,
// //   Clock,
// //   FileText,
// //   UserCheck,
// //   Gift,
// // } from "lucide-react";
// // import { toast } from "react-toastify";
// // import axios from "axios";
// // import { postActivity } from "../lib/postActivity";

// // const API_URL = import.meta.env.VITE_API_URL;

// // const LeaveRequests = () => {
// //   const { isHR, user } = useAuth();
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filterStatus, setFilterStatus] = useState("all");
// //   const [showAddDialog, setShowAddDialog] = useState(false);
// //   const [showGrantDialog, setShowGrantDialog] = useState(false);

// //   const API_BASE = API_URL;
// //   const token =
// //     typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
// //   const userId = user?.id || user?._id;

// //   const [leaveRequests, setLeaveRequests] = useState([]);
// //   const [currentLeaveBalance, setCurrentLeaveBalance] = useState(null);
// //   const [balanceLoading, setBalanceLoading] = useState(false);
// //   const [employees, setEmployees] = useState([]);

// //   const [newLeave, setNewLeave] = useState({
// //     leaveType: "",
// //     startDate: "",
// //     endDate: "",
// //     reason: "",
// //     isHalfDay: false,
// //   });

// //   const [grantLeave, setGrantLeave] = useState({
// //     employeeId: "",
// //     leaveType: "Compensatory Leave",
// //     days: 1,
// //     reason: "",
// //   });

// //   const statusOptions = ["all", "pending", "approved", "rejected"];
// //   const maxSickPersonal = 2;

// //   // Calculate used leaves
// //   const sickUsed = leaveRequests.filter(
// //     (r) => r.leaveType === "Sick Leave" && r.status === "approved",
// //   ).length;
// //   const personalUsed = leaveRequests.filter(
// //     (r) => r.leaveType === "Personal Leave" && r.status === "approved",
// //   ).length;

// //   const leaveTypeOptions = [
// //     { value: "Annual Leave", label: "Annual Leave" },
// //     {
// //       value: "Sick Leave",
// //       label: `Sick Leave (${sickUsed}/${maxSickPersonal})`,
// //     },
// //     {
// //       value: "Personal Leave",
// //       label: `Personal Leave (${personalUsed}/${maxSickPersonal})`,
// //     },
// //     { value: "Maternity Leave", label: "Maternity Leave" },
// //     { value: "Paternity Leave", label: "Paternity Leave" },
// //     { value: "Casual Leave", label: "Casual Leave" },
// //     { value: "Earned Leave", label: "Earned Leave" },
// //     { value: "Study Leave", label: "Study Leave" },
// //     { value: "Compensatory Leave", label: "Compensatory Leave" },
// //   ];

// //   const toBackendType = (type) => {
// //     const map = {
// //       "Annual Leave": "vacation",
// //       "Sick Leave": "sick",
// //       "Personal Leave": "personal",
// //       "Maternity Leave": "maternity",
// //       "Paternity Leave": "paternity",
// //       "Casual Leave": "casual",
// //       "Earned Leave": "earned",
// //       "Study Leave": "study",
// //       "Compensatory Leave": "compensatory",
// //     };
// //     return map[type] || "personal";
// //   };

// //   const toFrontendType = (type) => {
// //     const map = {
// //       vacation: "Annual Leave",
// //       sick: "Sick Leave",
// //       personal: "Personal Leave",
// //       maternity: "Maternity Leave",
// //       paternity: "Paternity Leave",
// //       casual: "Casual Leave",
// //       earned: "Earned Leave",
// //       study: "Study Leave",
// //       compensatory: "Compensatory Leave",
// //     };
// //     return map[type] || type;
// //   };

// //   const formatDate = (date) => date.toISOString().slice(0, 10);

// //   const addDays = (date, days) => {
// //     const result = new Date(date);
// //     result.setDate(result.getDate() + days);
// //     return result;
// //   };

// //   const addMonths = (date, months) => {
// //     const result = new Date(date);
// //     result.setMonth(result.getMonth() + months);
// //     return result;
// //   };

// //   const getAutoDatesForLeaveType = (type) => {
// //     const today = new Date();
// //     if (type === "Paternity Leave") {
// //       return {
// //         startDate: formatDate(today),
// //         endDate: formatDate(addDays(today, 5)),
// //       };
// //     }
// //     if (type === "Maternity Leave") {
// //       return {
// //         startDate: formatDate(today),
// //         endDate: formatDate(addMonths(today, 6)),
// //       };
// //     }
// //     return {};
// //   };

// //   const updateEndDateAutomatically = (startDate, leaveType) => {
// //     if (!startDate || !leaveType) return;
// //     const start = new Date(startDate);
// //     let newEndDate;
// //     if (leaveType === "Paternity Leave")
// //       newEndDate = formatDate(addDays(start, 5));
// //     else if (leaveType === "Maternity Leave")
// //       newEndDate = formatDate(addMonths(start, 6));
// //     else return;
// //     setNewLeave((prev) => ({ ...prev, endDate: newEndDate }));
// //   };

// //   const mapLeave = (l) => ({
// //     id: l._id,
// //     employeeId: l.employee?.employeeId || "",
// //     employeeName: l.employee?.name || "",
// //     profileImage: l.employee?.profileImage || "",
// //     avatar: l.employee?.avatar || "",
// //     leaveType: toFrontendType(l.type),
// //     startDate: l.startDate,
// //     endDate: l.endDate,
// //     duration: l.days,
// //     leaveBalance: l.employee?.leaveBalance ?? null,
// //     reason: l.reason,
// //     status: l.status,
// //     appliedDate: l.createdAt,
// //   });

// //   const fetchLeaves = async () => {
// //     try {
// //       const res = await axios.get(`${API_BASE}/api/leave`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       const items = Array.isArray(res.data?.data) ? res.data.data : [];
// //       setLeaveRequests(items.map(mapLeave));
// //     } catch (err) {
// //       console.error(err);
// //       toast.error(
// //         err.response?.data?.message || "Failed to load leave requests",
// //       );
// //     }
// //   };

// //   const fetchCurrentEmployee = async () => {
// //     if (!token || !userId) return;
// //     setBalanceLoading(true);
// //     try {
// //       const res = await axios.get(`${API_BASE}/api/employees/${userId}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       setCurrentLeaveBalance(res.data?.data?.leaveBalance ?? null);
// //     } catch (err) {
// //       console.error(err);
// //     } finally {
// //       setBalanceLoading(false);
// //     }
// //   };

// //   const fetchEmployees = async () => {
// //     if (!isHR) return;
// //     try {
// //       const res = await axios.get(`${API_BASE}/api/employees`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       setEmployees(res.data?.data || []);
// //     } catch (err) {
// //       console.error(err);
// //       toast.error("Failed to load employees");
// //     }
// //   };

// //   useEffect(() => {
// //     if (token) {
// //       fetchLeaves();
// //       fetchCurrentEmployee();
// //       if (isHR) fetchEmployees();
// //     }
// //   }, [token, userId, isHR]);

// //   const calculateDuration = (startDate, endDate, isHalfDay) => {
// //     if (!startDate || !endDate) return 0;
// //     if (isHalfDay) return 0.5;
// //     const start = new Date(startDate);
// //     const end = new Date(endDate);
// //     if (start > end) return 0;
// //     const diffTime = Math.abs(end - start);
// //     return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
// //   };

// //   const duration = calculateDuration(
// //     newLeave.startDate,
// //     newLeave.endDate,
// //     newLeave.isHalfDay,
// //   );
// //   const leaveDays = duration;

// //   const isSpecialLeave = ["Maternity Leave", "Paternity Leave"].includes(
// //     newLeave.leaveType,
// //   );
// //   const isRestrictedLeave = ["Sick Leave", "Personal Leave"].includes(
// //     newLeave.leaveType,
// //   );

// //   const projectedRemaining =
// //     currentLeaveBalance != null ? currentLeaveBalance - leaveDays : null;

// //   const formatDays = (days) => {
// //     if (days == null) return "—";
// //     return Number.isInteger(days) ? days : days.toFixed(1);
// //   };

// //   const normalRequests = leaveRequests.filter(
// //     (r) => !["Maternity Leave", "Paternity Leave"].includes(r.leaveType),
// //   );
// //   const pendingRequests = normalRequests.filter(
// //     (r) => r.status === "pending",
// //   ).length;
// //   const approvedRequests = normalRequests.filter(
// //     (r) => r.status === "approved",
// //   ).length;
// //   const totalRequests = normalRequests.length;

// //   const handleAddLeave = async () => {
// //     if (
// //       !newLeave.leaveType ||
// //       !newLeave.startDate ||
// //       !newLeave.endDate ||
// //       !newLeave.reason
// //     ) {
// //       toast.error("Please fill in all required fields");
// //       return;
// //     }

// //     if (newLeave.isHalfDay && newLeave.startDate !== newLeave.endDate) {
// //       toast.error("Half Day leave can only be applied for the same day");
// //       return;
// //     }

// //     if (isRestrictedLeave) {
// //       const used =
// //         newLeave.leaveType === "Sick Leave" ? sickUsed : personalUsed;
// //       const remaining = maxSickPersonal - used;

// //       if (used >= maxSickPersonal) {
// //         toast.error(
// //           `You have already used maximum ${maxSickPersonal} ${newLeave.leaveType}.`,
// //         );
// //         return;
// //       }
// //       if (leaveDays > remaining) {
// //         toast.error(
// //           `You can only take ${remaining} more day(s) of ${newLeave.leaveType}.`,
// //         );
// //         return;
// //       }
// //     }

// //     if (
// //       !isSpecialLeave &&
// //       projectedRemaining !== null &&
// //       projectedRemaining < 0
// //     ) {
// //       toast.error(
// //         `Insufficient leave balance! You only have ${formatDays(currentLeaveBalance)} day(s) left.`,
// //       );
// //       return;
// //     }

// //     try {
// //       const payload = {
// //         type: newLeave.isHalfDay
// //           ? "half_day"
// //           : toBackendType(newLeave.leaveType),
// //         startDate: newLeave.startDate,
// //         endDate: newLeave.endDate,
// //         reason: newLeave.reason,
// //       };

// //       await axios.post(`${API_BASE}/api/leave`, payload, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       setNewLeave({
// //         leaveType: "",
// //         startDate: "",
// //         endDate: "",
// //         reason: "",
// //         isHalfDay: false,
// //       });
// //       setShowAddDialog(false);

// //       await fetchLeaves();
// //       await fetchCurrentEmployee();
// //       toast.success("Leave request submitted successfully!");

// //       postActivity({
// //         token,
// //         actor: user?.id || user?._id,
// //         action: "Submitted leave request",
// //         type: "leave",
// //         meta: { ...payload, isHalfDay: newLeave.isHalfDay },
// //       });
// //     } catch (err) {
// //       console.error(err);
// //       toast.error(
// //         err.response?.data?.message || "Failed to submit leave request",
// //       );
// //     }
// //   };

// //   const handleGrantLeave = async () => {
// //     if (!grantLeave.employeeId || !grantLeave.days || !grantLeave.reason) {
// //       toast.error("Please fill all required fields");
// //       return;
// //     }

// //     try {
// //       const res = await axios.post(
// //         `${API_BASE}/api/employees/${grantLeave.employeeId}/grant-leave`,
// //         {
// //           days: Number(grantLeave.days),
// //           type: toBackendType(grantLeave.leaveType),
// //           reason: grantLeave.reason,
// //         },
// //         {
// //           headers: { Authorization: `Bearer ${token}` },
// //         },
// //       );

// //       const newBal =
// //         res.data?.newBalance ?? res.data?.data?.leaveBalance ?? null;
// //       toast.success(
// //         newBal != null
// //           ? `Leave composed successfully! New balance: ${formatDays(newBal)} day(s)`
// //           : "Leave composed successfully! Added to employee balance.",
// //       );

// //       if (newBal != null) {
// //         setEmployees((prev) =>
// //           prev.map((emp) => {
// //             const key = emp.id || emp._id;
// //             if (String(key) === String(grantLeave.employeeId)) {
// //               return { ...emp, leaveBalance: newBal };
// //             }
// //             return emp;
// //           }),
// //         );
// //         if (String(grantLeave.employeeId) === String(userId)) {
// //           setCurrentLeaveBalance(newBal);
// //         }
// //       }

// //       setShowGrantDialog(false);
// //       setGrantLeave({
// //         employeeId: "",
// //         leaveType: "Compensatory Leave",
// //         days: 1,
// //         reason: "",
// //       });

// //       await fetchLeaves();
// //       await fetchCurrentEmployee();

// //       postActivity({
// //         token,
// //         actor: user?.id || user?._id,
// //         action: "Composed Leave",
// //         type: "leave",
// //         meta: grantLeave,
// //       });
// //     } catch (err) {
// //       console.error(err);
// //       toast.error(err.response?.data?.message || "Failed to compose leave");
// //     }
// //   };

// //   const handleApproveReject = async (id, status) => {
// //     try {
// //       await axios.patch(
// //         `${API_BASE}/api/leave/${id}/review`,
// //         { status },
// //         {
// //           headers: { Authorization: `Bearer ${token}` },
// //         },
// //       );
// //       await fetchLeaves();
// //       await fetchCurrentEmployee();
// //       toast.success(`Leave request ${status} successfully!`);
// //     } catch (err) {
// //       toast.error(err.response?.data?.message || "Failed to update request");
// //     }
// //   };

// //   const handleCancel = async (id) => {
// //     try {
// //       await axios.delete(`${API_BASE}/api/leave/${id}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
// //       await fetchCurrentEmployee();
// //       toast.success("Leave request cancelled");
// //     } catch (err) {
// //       toast.error(err.response?.data?.message || "Failed to cancel request");
// //     }
// //   };

// //   const getStatusBadge = (status) => {
// //     const variants = {
// //       pending: { variant: "secondary", label: "Pending", icon: Clock },
// //       approved: { variant: "default", label: "Approved", icon: Check },
// //       rejected: { variant: "destructive", label: "Rejected", icon: X },
// //     };
// //     const config = variants[status] || variants.pending;
// //     const Icon = config.icon;
// //     return (
// //       <Badge variant={config.variant} className="flex items-center gap-1">
// //         <Icon className="w-3 h-3" />
// //         {config.label}
// //       </Badge>
// //     );
// //   };

// //   const filteredRequests = leaveRequests.filter((request) => {
// //     const matchesSearch =
// //       request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       request.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
// //     const matchesStatus =
// //       filterStatus === "all" || request.status === filterStatus;
// //     return matchesSearch && matchesStatus;
// //   });

// //   return (
// //     <div className="container mx-auto p-6 space-y-6">
// //       {/* Header */}
// //       <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
// //         <div>
// //           <h1 className="text-3xl font-bold text-foreground">Leave Requests</h1>
// //           <p className="text-muted-foreground">
// //             {isHR
// //               ? "Manage employee leave requests"
// //               : "Submit and track your leave requests"}
// //           </p>
// //         </div>

// //         <div className="flex gap-3">
// //           {/* Request Leave Button - For Normal Employees */}
// //           {!isHR && (
// //             <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
// //               <DialogTrigger asChild>
// //                 <Button className="btn-gradient w-60">
// //                   <Plus className="w-5 h-5 mr-2" />
// //                   Request Leave
// //                 </Button>
// //               </DialogTrigger>

// //               <DialogContent style={{ maxHeight: "90vh", overflowY: "auto" }}>
// //                 <DialogHeader>
// //                   <DialogTitle>Submit Leave Request</DialogTitle>
// //                   <DialogDescription>
// //                     Fill in the details for your leave request
// //                   </DialogDescription>
// //                 </DialogHeader>

// //                 <div className="space-y-4">
// //                   <div>
// //                     <Label htmlFor="leaveType">Leave Type</Label>
// //                     <Select
// //                       value={newLeave.leaveType}
// //                       onValueChange={(value) => {
// //                         const autoDates = getAutoDatesForLeaveType(value);
// //                         setNewLeave({
// //                           ...newLeave,
// //                           leaveType: value,
// //                           ...autoDates,
// //                           isHalfDay: false,
// //                         });
// //                       }}
// //                     >
// //                       <SelectTrigger>
// //                         <SelectValue placeholder="Select leave type" />
// //                       </SelectTrigger>
// //                       <SelectContent>
// //                         {leaveTypeOptions.map((item) => (
// //                           <SelectItem key={item.value} value={item.value}>
// //                             {item.label}
// //                           </SelectItem>
// //                         ))}
// //                       </SelectContent>
// //                     </Select>
// //                   </div>

// //                   {newLeave.leaveType && (
// //                     <div className="flex items-center space-x-2">
// //                       <input
// //                         type="checkbox"
// //                         id="isHalfDay"
// //                         checked={newLeave.isHalfDay}
// //                         onChange={(e) => {
// //                           const isHalf = e.target.checked;
// //                           setNewLeave((prev) => ({
// //                             ...prev,
// //                             isHalfDay: isHalf,
// //                             endDate: isHalf ? prev.startDate : prev.endDate,
// //                           }));
// //                         }}
// //                         className="w-4 h-4 accent-primary"
// //                       />
// //                       <Label htmlFor="isHalfDay" className="cursor-pointer">
// //                         Half Day Leave
// //                       </Label>
// //                     </div>
// //                   )}

// //                   <div>
// //                     <Label htmlFor="startDate">Start Date</Label>
// //                     <Input
// //                       id="startDate"
// //                       type="date"
// //                       value={newLeave.startDate}
// //                       onChange={(e) => {
// //                         const newStart = e.target.value;
// //                         setNewLeave((prev) => ({
// //                           ...prev,
// //                           startDate: newStart,
// //                           endDate: prev.isHalfDay ? newStart : prev.endDate,
// //                         }));
// //                         updateEndDateAutomatically(
// //                           newStart,
// //                           newLeave.leaveType,
// //                         );
// //                       }}
// //                     />
// //                   </div>

// //                   <div>
// //                     <Label htmlFor="endDate">End Date</Label>
// //                     <Input
// //                       id="endDate"
// //                       type="date"
// //                       value={newLeave.endDate}
// //                       onChange={(e) =>
// //                         setNewLeave((prev) => ({
// //                           ...prev,
// //                           endDate: e.target.value,
// //                         }))
// //                       }
// //                       disabled={newLeave.isHalfDay}
// //                     />
// //                   </div>

// //                   {newLeave.startDate && newLeave.endDate && (
// //                     <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
// //                       <p className="text-green-700 dark:text-green-400 font-semibold text-lg">
// //                         Duration:{" "}
// //                         <span className="text-3xl font-bold">
// //                           {formatDays(leaveDays)}
// //                         </span>{" "}
// //                         day(s)
// //                       </p>
// //                     </div>
// //                   )}

// //                   {isRestrictedLeave && (
// //                     <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
// //                       <p className="text-blue-700 dark:text-blue-400 font-medium">
// //                         {newLeave.leaveType}:{" "}
// //                         {newLeave.leaveType === "Sick Leave"
// //                           ? sickUsed
// //                           : personalUsed}{" "}
// //                         / 2 used
// //                       </p>
// //                     </div>
// //                   )}

// //                   {currentLeaveBalance != null && (
// //                     <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
// //                       <div className="flex items-center justify-between gap-4 mb-2">
// //                         <p className="text-sm text-muted-foreground">
// //                           Remaining leave balance
// //                         </p>
// //                         {balanceLoading && (
// //                           <span className="text-xs text-muted-foreground">
// //                             Loading...
// //                           </span>
// //                         )}
// //                       </div>
// //                       <p className="text-2xl font-semibold">
// //                         {formatDays(currentLeaveBalance)} day(s)
// //                       </p>

// //                       {!isSpecialLeave && projectedRemaining !== null && (
// //                         <p
// //                           className={`mt-2 text-sm font-medium ${projectedRemaining < 0 ? "text-destructive" : "text-emerald-600"}`}
// //                         >
// //                           {projectedRemaining < 0
// //                             ? `Insufficient balance! You only have ${formatDays(currentLeaveBalance)} day(s)`
// //                             : `After this request: ${formatDays(projectedRemaining)} day(s) remaining`}
// //                         </p>
// //                       )}
// //                     </div>
// //                   )}

// //                   <div>
// //                     <Label htmlFor="reason">Reason</Label>
// //                     <Textarea
// //                       id="reason"
// //                       placeholder="Please provide a reason for your leave..."
// //                       value={newLeave.reason}
// //                       onChange={(e) =>
// //                         setNewLeave({ ...newLeave, reason: e.target.value })
// //                       }
// //                       rows={4}
// //                     />
// //                   </div>
// //                 </div>

// //                 <div className="flex justify-end space-x-3 pt-4">
// //                   <Button
// //                     variant="outline"
// //                     onClick={() => setShowAddDialog(false)}
// //                   >
// //                     Cancel
// //                   </Button>
// //                   <Button onClick={handleAddLeave} className="btn-gradient">
// //                     Submit Request
// //                   </Button>
// //                 </div>
// //               </DialogContent>
// //             </Dialog>
// //           )}

// //           {/* Compose Leave Button - For HR */}
// //           {isHR && (
// //             <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
// //               <DialogTrigger asChild>
// //                 <Button className="btn-gradient">
// //                   <Gift className="w-5 h-5 mr-2" />
// //                   Compose Leave
// //                 </Button>
// //               </DialogTrigger>

// //               <DialogContent>
// //                 <DialogHeader>
// //                   <DialogTitle>Compose Leave</DialogTitle>
// //                   <DialogDescription>
// //                     Add leave balance directly to an employee account
// //                   </DialogDescription>
// //                 </DialogHeader>

// //                 <div className="space-y-4 py-4">
// //                   <div>
// //                     <Label htmlFor="employee">Select Employee</Label>
// //                     <select
// //                       id="employee"
// //                       className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
// //                       value={grantLeave.employeeId}
// //                       onChange={(e) =>
// //                         setGrantLeave((prev) => ({
// //                           ...prev,
// //                           employeeId: e.target.value,
// //                         }))
// //                       }
// //                     >
// //                       <option value="">Select employee</option>
// //                       {employees.map((emp) => (
// //                         <option
// //                           key={emp.id || emp._id}
// //                           value={emp.id || emp._id}
// //                         >
// //                           {emp.name} ({emp.employeeId || emp.id || emp._id})
// //                         </option>
// //                       ))}
// //                     </select>
// //                   </div>

// //                   <div>
// //                     <Label>Leave Type</Label>
// //                     <Select
// //                       value={grantLeave.leaveType}
// //                       onValueChange={(value) =>
// //                         setGrantLeave((prev) => ({ ...prev, leaveType: value }))
// //                       }
// //                     >
// //                       <SelectTrigger>
// //                         <SelectValue />
// //                       </SelectTrigger>
// //                       <SelectContent>
// //                         {leaveTypeOptions.map((item) => (
// //                           <SelectItem key={item.value} value={item.value}>
// //                             {item.label}
// //                           </SelectItem>
// //                         ))}
// //                       </SelectContent>
// //                     </Select>
// //                   </div>

// //                   <div>
// //                     <Label htmlFor="days">Number of Days</Label>
// //                     <Input
// //                       id="days"
// //                       type="number"
// //                       min="0.5"
// //                       step="0.5"
// //                       value={grantLeave.days}
// //                       onChange={(e) =>
// //                         setGrantLeave((prev) => ({
// //                           ...prev,
// //                           days: e.target.value,
// //                         }))
// //                       }
// //                     />
// //                   </div>

// //                   <div>
// //                     <Label htmlFor="reason">Reason / Remarks</Label>
// //                     <Textarea
// //                       id="reason"
// //                       placeholder="Compensatory leave for extra hours, festival adjustment, etc."
// //                       value={grantLeave.reason}
// //                       onChange={(e) =>
// //                         setGrantLeave((prev) => ({
// //                           ...prev,
// //                           reason: e.target.value,
// //                         }))
// //                       }
// //                       rows={3}
// //                     />
// //                   </div>
// //                 </div>

// //                 <div className="flex justify-end space-x-3 pt-4">
// //                   <Button
// //                     variant="outline"
// //                     onClick={() => setShowGrantDialog(false)}
// //                   >
// //                     Cancel
// //                   </Button>
// //                   <Button onClick={handleGrantLeave} className="btn-gradient">
// //                     Add to Leave Balance
// //                   </Button>
// //                 </div>
// //               </DialogContent>
// //             </Dialog>
// //           )}
// //         </div>
// //       </div>

// //       {/* Stats Cards */}
// //       <div className="flex flex-wrap gap-4 mb-5">
// //         {isHR ? (
// //           <>
// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">
// //                     Total Requests
// //                   </CardTitle>
// //                   <FileText className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">{totalRequests}</div>
// //                   <p className="text-xs text-muted-foreground">This month</p>
// //                 </CardContent>
// //               </Card>
// //             </div>

// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">
// //                     Pending Reviews
// //                   </CardTitle>
// //                   <Clock className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">{pendingRequests}</div>
// //                   <p className="text-xs text-muted-foreground">
// //                     Require your attention
// //                   </p>
// //                 </CardContent>
// //               </Card>
// //             </div>

// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">
// //                     Approved Requests
// //                   </CardTitle>
// //                   <Check className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">{approvedRequests}</div>
// //                   <p className="text-xs text-muted-foreground">This month</p>
// //                 </CardContent>
// //               </Card>
// //             </div>
// //           </>
// //         ) : (
// //           <>
// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">
// //                     Remaining Leave Balance
// //                   </CardTitle>
// //                   <UserCheck className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">
// //                     {balanceLoading ? "..." : formatDays(currentLeaveBalance)}
// //                   </div>
// //                   <p className="text-xs text-muted-foreground">
// //                     available to use
// //                   </p>
// //                 </CardContent>
// //               </Card>
// //             </div>

// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">
// //                     Sick Leave
// //                   </CardTitle>
// //                   <Clock className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">{sickUsed} / 2</div>
// //                   <p className="text-xs text-muted-foreground">used</p>
// //                 </CardContent>
// //               </Card>
// //             </div>

// //             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
// //               <Card className="dashboard-card">
// //                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //                   <CardTitle className="text-sm font-medium">
// //                     Pending Requests
// //                   </CardTitle>
// //                   <Clock className="h-4 w-4 text-muted-foreground" />
// //                 </CardHeader>
// //                 <CardContent>
// //                   <div className="text-2xl font-bold">{pendingRequests}</div>
// //                   <p className="text-xs text-muted-foreground">
// //                     Awaiting approval
// //                   </p>
// //                 </CardContent>
// //               </Card>
// //             </div>
// //           </>
// //         )}
// //       </div>

// //       {/* Filters */}
// //       <Card className="dashboard-card">
// //         <CardContent className="pt-6">
// //           <div className="flex flex-wrap items-center gap-4 mb-5">
// //             <div className="relative flex-1 min-w-full sm:min-w-[250px] md:min-w-[300px]">
// //               <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
// //               <Input
// //                 placeholder="Search by employee name or ID..."
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //                 className="pl-10"
// //               />
// //             </div>
// //             <div className="flex-1 min-w-full sm:min-w-[220px]">
// //               <Select value={filterStatus} onValueChange={setFilterStatus}>
// //                 <SelectTrigger>
// //                   <Filter className="w-4 h-4 mr-2" />
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   {statusOptions.map((status) => (
// //                     <SelectItem key={status} value={status}>
// //                       {status === "all"
// //                         ? "All Status"
// //                         : status.charAt(0).toUpperCase() + status.slice(1)}
// //                     </SelectItem>
// //                   ))}
// //                 </SelectContent>
// //               </Select>
// //             </div>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Leave Requests Table */}
// //       <Card className="data-table">
// //         <Table>
// //           <TableHeader>
// //             <TableRow>
// //               <TableHead>Employee</TableHead>
// //               <TableHead>Leave Type</TableHead>
// //               <TableHead>Start Date</TableHead>
// //               <TableHead>End Date</TableHead>
// //               <TableHead>Duration</TableHead>
// //               <TableHead>Balance</TableHead>
// //               <TableHead>Status</TableHead>
// //               <TableHead>Applied Date</TableHead>
// //               <TableHead>Actions</TableHead>
// //             </TableRow>
// //           </TableHeader>
// //           <TableBody>
// //             {filteredRequests.map((request) => (
// //               <TableRow key={request.id}>
// //                 <TableCell>
// //                   <div className="flex items-center space-x-3">
// //                     <Avatar className="w-8 h-8">
// //                       <AvatarImage
// //                         src={
// //                           request.profileImage ||
// //                           request.avatar ||
// //                           `https://ui-avatars.com/api/?name=${encodeURIComponent(request.employeeName)}&background=0D8ABC&color=fff`
// //                         }
// //                         alt={request.employeeName}
// //                       />
// //                       <AvatarFallback>
// //                         {request.employeeName
// //                           .split(" ")
// //                           .map((n) => n[0])
// //                           .join("")}
// //                       </AvatarFallback>
// //                     </Avatar>
// //                     <div>
// //                       <p className="font-medium">{request.employeeName}</p>
// //                       <p className="text-sm text-muted-foreground">
// //                         {request.employeeId}
// //                       </p>
// //                     </div>
// //                   </div>
// //                 </TableCell>
// //                 <TableCell>{request.leaveType}</TableCell>
// //                 <TableCell>
// //                   {new Date(request.startDate).toLocaleDateString()}
// //                 </TableCell>
// //                 <TableCell>
// //                   {new Date(request.endDate).toLocaleDateString()}
// //                 </TableCell>
// //                 <TableCell>{request.duration} day(s)</TableCell>
// //                 <TableCell>
// //                   {request.leaveBalance != null
// //                     ? `${request.leaveBalance} day(s)`
// //                     : "—"}
// //                 </TableCell>
// //                 <TableCell>{getStatusBadge(request.status)}</TableCell>
// //                 <TableCell>
// //                   {new Date(request.appliedDate).toLocaleDateString()}
// //                 </TableCell>
// //                 <TableCell>
// //                   <div className="flex space-x-2">
// //                     {isHR && request.status === "pending" && (
// //                       <>
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           className="text-green-600 hover:text-green-700"
// //                           onClick={() =>
// //                             handleApproveReject(request.id, "approved")
// //                           }
// //                         >
// //                           <Check className="w-4 h-4" />
// //                         </Button>
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           className="text-destructive hover:text-destructive"
// //                           onClick={() =>
// //                             handleApproveReject(request.id, "rejected")
// //                           }
// //                         >
// //                           <X className="w-4 h-4" />
// //                         </Button>
// //                       </>
// //                     )}
// //                     {!isHR &&
// //                       request.status === "pending" &&
// //                       request.employeeId === (user?.employeeId || "") && (
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           className="text-destructive hover:text-destructive"
// //                           onClick={() => handleCancel(request.id)}
// //                         >
// //                           <X className="w-4 h-4" /> Cancel
// //                         </Button>
// //                       )}
// //                   </div>
// //                 </TableCell>
// //               </TableRow>
// //             ))}
// //           </TableBody>
// //         </Table>
// //       </Card>

// //       {filteredRequests.length === 0 && (
// //         <div className="text-center py-12">
// //           <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
// //           <h3 className="text-lg font-semibold mb-2">
// //             No leave requests found
// //           </h3>
// //           <p className="text-muted-foreground">
// //             Try adjusting your search or filters
// //           </p>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default LeaveRequests;

// import { useEffect, useState } from "react";
// import { useAuth } from "../contexts/AuthContext";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "../components/ui/card";
// import { Badge } from "../components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "../components/ui/dialog";
// import { Label } from "../components/ui/label";
// import { Textarea } from "../components/ui/textarea";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../components/ui/table";
// import {
//   Search,
//   Plus,
//   Filter,
//   Check,
//   X,
//   Calendar,
//   Clock,
//   FileText,
//   UserCheck,
//   Gift,
// } from "lucide-react";
// import { toast } from "react-toastify";
// import axios from "axios";
// import { postActivity } from "../lib/postActivity";

// const API_URL = import.meta.env.VITE_API_URL;

// const LeaveRequests = () => {
//   const { isHR, user } = useAuth();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [showAddDialog, setShowAddDialog] = useState(false);
//   const [showGrantDialog, setShowGrantDialog] = useState(false);

//   const API_BASE = API_URL;
//   const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
//   const userId = user?.id || user?._id;

//   const [leaveRequests, setLeaveRequests] = useState([]);
//   const [currentLeaveBalance, setCurrentLeaveBalance] = useState(null);
//   const [balanceLoading, setBalanceLoading] = useState(false);
//   const [employees, setEmployees] = useState([]);

//   const [newLeave, setNewLeave] = useState({
//     leaveType: "",
//     startDate: "",
//     endDate: "",
//     reason: "",
//     isHalfDay: false,
//   });

//   const [grantLeave, setGrantLeave] = useState({
//     employeeId: "",
//     leaveType: "Compensatory Leave",
//     days: 1,
//     reason: "",
//   });

//   const statusOptions = ["all", "pending", "approved", "rejected"];
//   const maxSickPersonal = 2;

//   // Calculate used leaves
//   const sickUsed = leaveRequests.filter(r => r.leaveType === "Sick Leave" && r.status === "approved").length;
//   const personalUsed = leaveRequests.filter(r => r.leaveType === "Personal Leave" && r.status === "approved").length;

//   const leaveTypeOptions = [
//     { value: "Annual Leave", label: "Annual Leave" },
//     { value: "Sick Leave", label: `Sick Leave (${sickUsed}/${maxSickPersonal})` },
//     { value: "Personal Leave", label: `Personal Leave (${personalUsed}/${maxSickPersonal})` },
//     { value: "Maternity Leave", label: "Maternity Leave" },
//     { value: "Paternity Leave", label: "Paternity Leave" },
//     { value: "Casual Leave", label: "Casual Leave" },
//     { value: "Earned Leave", label: "Earned Leave" },
//     { value: "Study Leave", label: "Study Leave" },
//     { value: "Compensatory Leave", label: "Compensatory Leave" },
//   ];

//   const toBackendType = (type) => {
//     const map = {
//       "Annual Leave": "vacation",
//       "Sick Leave": "sick",
//       "Personal Leave": "personal",
//       "Maternity Leave": "maternity",
//       "Paternity Leave": "paternity",
//       "Casual Leave": "casual",
//       "Earned Leave": "earned",
//       "Study Leave": "study",
//       "Compensatory Leave": "compensatory",
//     };
//     return map[type] || "personal";
//   };

//   const toFrontendType = (type) => {
//     const map = {
//       vacation: "Annual Leave",
//       sick: "Sick Leave",
//       personal: "Personal Leave",
//       maternity: "Maternity Leave",
//       paternity: "Paternity Leave",
//       casual: "Casual Leave",
//       earned: "Earned Leave",
//       study: "Study Leave",
//       compensatory: "Compensatory Leave",
//     };
//     return map[type] || type;
//   };

//   const formatDate = (date) => date.toISOString().slice(0, 10);

//   const addDays = (date, days) => {
//     const result = new Date(date);
//     result.setDate(result.getDate() + days);
//     return result;
//   };

//   const addMonths = (date, months) => {
//     const result = new Date(date);
//     result.setMonth(result.getMonth() + months);
//     return result;
//   };

//   const getAutoDatesForLeaveType = (type) => {
//     const today = new Date();
//     if (type === "Paternity Leave") {
//       return { startDate: formatDate(today), endDate: formatDate(addDays(today, 5)) };
//     }
//     if (type === "Maternity Leave") {
//       return { startDate: formatDate(today), endDate: formatDate(addMonths(today, 6)) };
//     }
//     return {};
//   };

//   const updateEndDateAutomatically = (startDate, leaveType) => {
//     if (!startDate || !leaveType) return;
//     const start = new Date(startDate);
//     let newEndDate;
//     if (leaveType === "Paternity Leave") newEndDate = formatDate(addDays(start, 5));
//     else if (leaveType === "Maternity Leave") newEndDate = formatDate(addMonths(start, 6));
//     else return;
//     setNewLeave((prev) => ({ ...prev, endDate: newEndDate }));
//   };

//   const mapLeave = (l) => ({
//     id: l._id,
//     employeeId: l.employee?.employeeId || "",
//     employeeName: l.employee?.name || "",
//     profileImage: l.employee?.profileImage || "",
//     avatar: l.employee?.avatar || "",
//     leaveType: toFrontendType(l.type),
//     startDate: l.startDate,
//     endDate: l.endDate,
//     duration: l.days,
//     leaveBalance: l.employee?.leaveBalance ?? null,
//     reason: l.reason,
//     status: l.status,
//     appliedDate: l.createdAt,
//   });

//   const fetchLeaves = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/api/leave`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const items = Array.isArray(res.data?.data) ? res.data.data : [];
//       setLeaveRequests(items.map(mapLeave));
//     } catch (err) {
//       console.error(err);
//       toast.error(err.response?.data?.message || "Failed to load leave requests");
//     }
//   };

//   const fetchCurrentEmployee = async () => {
//     if (!token || !userId) return;
//     setBalanceLoading(true);
//     try {
//       const res = await axios.get(`${API_BASE}/api/employees/${userId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setCurrentLeaveBalance(res.data?.data?.leaveBalance ?? null);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setBalanceLoading(false);
//     }
//   };

//   const fetchEmployees = async () => {
//     if (!isHR) return;
//     try {
//       const res = await axios.get(`${API_BASE}/api/employees`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setEmployees(res.data?.data || []);
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to load employees");
//     }
//   };

//   useEffect(() => {
//     if (token) {
//       fetchLeaves();
//       fetchCurrentEmployee();
//       if (isHR) fetchEmployees();
//     }
//   }, [token, userId, isHR]);

//   const calculateDuration = (startDate, endDate, isHalfDay) => {
//     if (!startDate || !endDate) return 0;
//     if (isHalfDay) return 0.5;
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     if (start > end) return 0;
//     const diffTime = Math.abs(end - start);
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
//   };

//   const duration = calculateDuration(newLeave.startDate, newLeave.endDate, newLeave.isHalfDay);
//   const leaveDays = duration;

//   const isSpecialLeave = ["Maternity Leave", "Paternity Leave"].includes(newLeave.leaveType);
//   const isRestrictedLeave = ["Sick Leave", "Personal Leave"].includes(newLeave.leaveType);

//   const projectedRemaining = currentLeaveBalance != null ? currentLeaveBalance - leaveDays : null;

//   const formatDays = (days) => {
//     if (days == null) return "—";
//     return Number.isInteger(days) ? days : days.toFixed(1);
//   };

//   const normalRequests = leaveRequests.filter(
//     (r) => !["Maternity Leave", "Paternity Leave"].includes(r.leaveType)
//   );
//   const pendingRequests = normalRequests.filter((r) => r.status === "pending").length;
//   const approvedRequests = normalRequests.filter((r) => r.status === "approved").length;
//   const totalRequests = normalRequests.length;

//   const handleAddLeave = async () => {
//     if (!newLeave.leaveType || !newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
//       toast.error("Please fill in all required fields");
//       return;
//     }

//     if (newLeave.isHalfDay && newLeave.startDate !== newLeave.endDate) {
//       toast.error("Half Day leave can only be applied for the same day");
//       return;
//     }

//     if (isRestrictedLeave) {
//       const used = newLeave.leaveType === "Sick Leave" ? sickUsed : personalUsed;
//       const remaining = maxSickPersonal - used;

//       if (used >= maxSickPersonal) {
//         toast.error(`You have already used maximum ${maxSickPersonal} ${newLeave.leaveType}.`);
//         return;
//       }
//       if (leaveDays > remaining) {
//         toast.error(`You can only take ${remaining} more day(s) of ${newLeave.leaveType}.`);
//         return;
//       }
//     }

//     if (!isSpecialLeave && projectedRemaining !== null && projectedRemaining < 0) {
//       toast.error(`Insufficient leave balance! You only have ${formatDays(currentLeaveBalance)} day(s) left.`);
//       return;
//     }

//     try {
//       const payload = {
//         type: newLeave.isHalfDay ? "half_day" : toBackendType(newLeave.leaveType),
//         startDate: newLeave.startDate,
//         endDate: newLeave.endDate,
//         reason: newLeave.reason,
//       };

//       await axios.post(`${API_BASE}/api/leave`, payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setNewLeave({
//         leaveType: "",
//         startDate: "",
//         endDate: "",
//         reason: "",
//         isHalfDay: false,
//       });
//       setShowAddDialog(false);

//       await fetchLeaves();
//       await fetchCurrentEmployee();
//       toast.success("Leave request submitted successfully!");

//       postActivity({
//         token,
//         actor: user?.id || user?._id,
//         action: "Submitted leave request",
//         type: "leave",
//         meta: { ...payload, isHalfDay: newLeave.isHalfDay },
//       });
//     } catch (err) {
//       console.error(err);
//       toast.error(err.response?.data?.message || "Failed to submit leave request");
//     }
//   };

//   const handleGrantLeave = async () => {
//     if (!grantLeave.employeeId || !grantLeave.days || !grantLeave.reason) {
//       toast.error("Please fill all required fields");
//       return;
//     }

//     try {
//       const res = await axios.post(
//         `${API_BASE}/api/employees/${grantLeave.employeeId}/grant-leave`,
//         {
//           days: Number(grantLeave.days),
//           type: toBackendType(grantLeave.leaveType),
//           reason: grantLeave.reason,
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       const newBalance = res.data?.newBalance ?? res.data?.data?.leaveBalance;

//       toast.success(`Leave composed successfully! New Balance: ${formatDays(newBalance)} day(s)`);

//       // Update employees list
//       setEmployees((prev) =>
//         prev.map((emp) => {
//           if (String(emp._id || emp.id) === String(grantLeave.employeeId)) {
//             return { ...emp, leaveBalance: newBalance };
//           }
//           return emp;
//         })
//       );

//       // Update current user balance if granted to self
//       if (String(grantLeave.employeeId) === String(userId)) {
//         setCurrentLeaveBalance(newBalance);
//       }

//       setShowGrantDialog(false);
//       setGrantLeave({
//         employeeId: "",
//         leaveType: "Compensatory Leave",
//         days: 1,
//         reason: "",
//       });

//       await Promise.all([fetchLeaves(), fetchCurrentEmployee(), fetchEmployees()]);
//     } catch (err) {
//       console.error(err);
//       toast.error(err.response?.data?.message || "Failed to compose leave");
//     }
//   };

//   const handleApproveReject = async (id, status) => {
//     try {
//       await axios.patch(`${API_BASE}/api/leave/${id}/review`, { status }, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       await fetchLeaves();
//       await fetchCurrentEmployee();
//       toast.success(`Leave request ${status} successfully!`);
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to update request");
//     }
//   };

//   const handleCancel = async (id) => {
//     try {
//       await axios.delete(`${API_BASE}/api/leave/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
//       await fetchCurrentEmployee();
//       toast.success("Leave request cancelled");
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to cancel request");
//     }
//   };

//   const getStatusBadge = (status) => {
//     const variants = {
//       pending: { variant: "secondary", label: "Pending", icon: Clock },
//       approved: { variant: "default", label: "Approved", icon: Check },
//       rejected: { variant: "destructive", label: "Rejected", icon: X },
//     };
//     const config = variants[status] || variants.pending;
//     const Icon = config.icon;
//     return (
//       <Badge variant={config.variant} className="flex items-center gap-1">
//         <Icon className="w-3 h-3" />
//         {config.label}
//       </Badge>
//     );
//   };

//   const filteredRequests = leaveRequests.filter((request) => {
//     const matchesSearch =
//       request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       request.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = filterStatus === "all" || request.status === filterStatus;
//     return matchesSearch && matchesStatus;
//   });

//   return (
//     <div className="container mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">Leave Requests</h1>
//           <p className="text-muted-foreground">
//             {isHR ? "Manage employee leave requests" : "Submit and track your leave requests"}
//           </p>
//         </div>

//         <div className="flex gap-3">
//           {!isHR && (
//             <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
//               <DialogTrigger asChild>
//                 <Button className="btn-gradient w-60">
//                   <Plus className="w-5 h-5 mr-2" />
//                   Request Leave
//                 </Button>
//               </DialogTrigger>

//               <DialogContent style={{ maxHeight: "90vh", overflowY: "auto" }}>
//                 <DialogHeader>
//                   <DialogTitle>Submit Leave Request</DialogTitle>
//                   <DialogDescription>Fill in the details for your leave request</DialogDescription>
//                 </DialogHeader>

//                 <div className="space-y-4">
//                   <div>
//                     <Label htmlFor="leaveType">Leave Type</Label>
//                     <Select
//                       value={newLeave.leaveType}
//                       onValueChange={(value) => {
//                         const autoDates = getAutoDatesForLeaveType(value);
//                         setNewLeave({
//                           ...newLeave,
//                           leaveType: value,
//                           ...autoDates,
//                           isHalfDay: false,
//                         });
//                       }}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select leave type" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {leaveTypeOptions.map((item) => (
//                           <SelectItem key={item.value} value={item.value}>
//                             {item.label}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   {newLeave.leaveType && (
//                     <div className="flex items-center space-x-2">
//                       <input
//                         type="checkbox"
//                         id="isHalfDay"
//                         checked={newLeave.isHalfDay}
//                         onChange={(e) => {
//                           const isHalf = e.target.checked;
//                           setNewLeave((prev) => ({
//                             ...prev,
//                             isHalfDay: isHalf,
//                             endDate: isHalf ? prev.startDate : prev.endDate,
//                           }));
//                         }}
//                         className="w-4 h-4 accent-primary"
//                       />
//                       <Label htmlFor="isHalfDay" className="cursor-pointer">Half Day Leave</Label>
//                     </div>
//                   )}

//                   <div>
//                     <Label htmlFor="startDate">Start Date</Label>
//                     <Input
//                       id="startDate"
//                       type="date"
//                       value={newLeave.startDate}
//                       onChange={(e) => {
//                         const newStart = e.target.value;
//                         setNewLeave((prev) => ({
//                           ...prev,
//                           startDate: newStart,
//                           endDate: prev.isHalfDay ? newStart : prev.endDate,
//                         }));
//                         updateEndDateAutomatically(newStart, newLeave.leaveType);
//                       }}
//                     />
//                   </div>

//                   <div>
//                     <Label htmlFor="endDate">End Date</Label>
//                     <Input
//                       id="endDate"
//                       type="date"
//                       value={newLeave.endDate}
//                       onChange={(e) => setNewLeave((prev) => ({ ...prev, endDate: e.target.value }))}
//                       disabled={newLeave.isHalfDay}
//                     />
//                   </div>

//                   {newLeave.startDate && newLeave.endDate && (
//                     <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
//                       <p className="text-green-700 dark:text-green-400 font-semibold text-lg">
//                         Duration: <span className="text-3xl font-bold">{formatDays(leaveDays)}</span> day(s)
//                       </p>
//                     </div>
//                   )}

//                   {isRestrictedLeave && (
//                     <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
//                       <p className="text-blue-700 dark:text-blue-400 font-medium">
//                         {newLeave.leaveType}: {newLeave.leaveType === "Sick Leave" ? sickUsed : personalUsed} / 2 used
//                       </p>
//                     </div>
//                   )}

//                   {currentLeaveBalance != null && (
//                     <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
//                       <div className="flex items-center justify-between gap-4 mb-2">
//                         <p className="text-sm text-muted-foreground">Remaining leave balance</p>
//                         {balanceLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
//                       </div>
//                       <p className="text-2xl font-semibold">{formatDays(currentLeaveBalance)} day(s)</p>

//                       {!isSpecialLeave && projectedRemaining !== null && (
//                         <p className={`mt-2 text-sm font-medium ${projectedRemaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
//                           {projectedRemaining < 0
//                             ? `Insufficient balance! You only have ${formatDays(currentLeaveBalance)} day(s)`
//                             : `After this request: ${formatDays(projectedRemaining)} day(s) remaining`}
//                         </p>
//                       )}
//                     </div>
//                   )}

//                   <div>
//                     <Label htmlFor="reason">Reason</Label>
//                     <Textarea
//                       id="reason"
//                       placeholder="Please provide a reason for your leave..."
//                       value={newLeave.reason}
//                       onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
//                       rows={4}
//                     />
//                   </div>
//                 </div>

//                 <div className="flex justify-end space-x-3 pt-4">
//                   <Button variant="outline" onClick={() => setShowAddDialog(false)}>
//                     Cancel
//                   </Button>
//                   <Button onClick={handleAddLeave} className="btn-gradient">
//                     Submit Request
//                   </Button>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           )}

//           {isHR && (
//             <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
//               <DialogTrigger asChild>
//                 <Button className="btn-gradient">
//                   <Gift className="w-5 h-5 mr-2" />
//                   Compose Leave
//                 </Button>
//               </DialogTrigger>

//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Compose Leave</DialogTitle>
//                   <DialogDescription>Add leave balance to an employee</DialogDescription>
//                 </DialogHeader>

//                 <div className="space-y-4 py-4">
//                   <div>
//                     <Label htmlFor="employee">Select Employee</Label>
//                     <Select
//                       value={grantLeave.employeeId}
//                       onValueChange={(value) => setGrantLeave((prev) => ({ ...prev, employeeId: value }))}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select employee" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {employees.map((emp) => (
//                           <SelectItem key={emp._id} value={emp._id}>
//                             {emp.name} ({emp.employeeId})
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label>Leave Type</Label>
//                     <Select
//                       value={grantLeave.leaveType}
//                       onValueChange={(value) => setGrantLeave((prev) => ({ ...prev, leaveType: value }))}
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {leaveTypeOptions.map((item) => (
//                           <SelectItem key={item.value} value={item.value}>
//                             {item.label}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label htmlFor="days">Number of Days</Label>
//                     <Input
//                       id="days"
//                       type="number"
//                       min="0.5"
//                       step="0.5"
//                       value={grantLeave.days}
//                       onChange={(e) => setGrantLeave((prev) => ({ ...prev, days: e.target.value }))}
//                     />
//                   </div>

//                   <div>
//                     <Label htmlFor="reason">Reason / Remarks</Label>
//                     <Textarea
//                       id="reason"
//                       placeholder="Compensatory leave for extra hours / festival adjustment etc."
//                       value={grantLeave.reason}
//                       onChange={(e) => setGrantLeave((prev) => ({ ...prev, reason: e.target.value }))}
//                       rows={3}
//                     />
//                   </div>
//                 </div>

//                 <div className="flex justify-end space-x-3 pt-4">
//                   <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
//                     Cancel
//                   </Button>
//                   <Button onClick={handleGrantLeave} className="btn-gradient">
//                     Add to Leave Balance
//                   </Button>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           )}
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="flex flex-wrap gap-4 mb-5">
//         {isHR ? (
//           <>
//             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
//               <Card className="dashboard-card">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
//                   <FileText className="h-4 w-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">{totalRequests}</div>
//                   <p className="text-xs text-muted-foreground">This month</p>
//                 </CardContent>
//               </Card>
//             </div>

//             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
//               <Card className="dashboard-card">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
//                   <Clock className="h-4 w-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">{pendingRequests}</div>
//                   <p className="text-xs text-muted-foreground">Require your attention</p>
//                 </CardContent>
//               </Card>
//             </div>

//             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
//               <Card className="dashboard-card">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
//                   <Check className="h-4 w-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">{approvedRequests}</div>
//                   <p className="text-xs text-muted-foreground">This month</p>
//                 </CardContent>
//               </Card>
//             </div>
//           </>
//         ) : (
//           <>
//             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
//               <Card className="dashboard-card">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">Remaining Leave Balance</CardTitle>
//                   <UserCheck className="h-4 w-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">
//                     {balanceLoading ? "..." : formatDays(currentLeaveBalance)}
//                   </div>
//                   <p className="text-xs text-muted-foreground">available to use</p>
//                 </CardContent>
//               </Card>
//             </div>

//             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
//               <Card className="dashboard-card">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">Sick Leave</CardTitle>
//                   <Clock className="h-4 w-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">{sickUsed} / 2</div>
//                   <p className="text-xs text-muted-foreground">used</p>
//                 </CardContent>
//               </Card>
//             </div>

//             <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
//               <Card className="dashboard-card">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
//                   <Clock className="h-4 w-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">{pendingRequests}</div>
//                   <p className="text-xs text-muted-foreground">Awaiting approval</p>
//                 </CardContent>
//               </Card>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Filters */}
//       <Card className="dashboard-card">
//         <CardContent className="pt-6">
//           <div className="flex flex-wrap items-center gap-4 mb-5">
//             <div className="relative flex-1 min-w-full sm:min-w-[250px] md:min-w-[300px]">
//               <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search by employee name or ID..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <div className="flex-1 min-w-full sm:min-w-[220px]">
//               <Select value={filterStatus} onValueChange={setFilterStatus}>
//                 <SelectTrigger>
//                   <Filter className="w-4 h-4 mr-2" />
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {statusOptions.map((status) => (
//                     <SelectItem key={status} value={status}>
//                       {status === "all" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Leave Requests Table */}
//       <Card className="data-table">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Employee</TableHead>
//               <TableHead>Leave Type</TableHead>
//               <TableHead>Start Date</TableHead>
//               <TableHead>End Date</TableHead>
//               <TableHead>Duration</TableHead>
//               <TableHead>Balance</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Applied Date</TableHead>
//               <TableHead>Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {filteredRequests.map((request) => (
//               <TableRow key={request.id}>
//                 <TableCell>
//                   <div className="flex items-center space-x-3">
//                     <Avatar className="w-8 h-8">
//                       <AvatarImage
//                         src={
//                           request.profileImage ||
//                           request.avatar ||
//                           `https://ui-avatars.com/api/?name=${encodeURIComponent(request.employeeName)}&background=0D8ABC&color=fff`
//                         }
//                         alt={request.employeeName}
//                       />
//                       <AvatarFallback>
//                         {request.employeeName.split(" ").map((n) => n[0]).join("")}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div>
//                       <p className="font-medium">{request.employeeName}</p>
//                       <p className="text-sm text-muted-foreground">{request.employeeId}</p>
//                     </div>
//                   </div>
//                 </TableCell>
//                 <TableCell>{request.leaveType}</TableCell>
//                 <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
//                 <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
//                 <TableCell>{request.duration} day(s)</TableCell>
//                 <TableCell>
//                   {request.leaveBalance != null ? `${request.leaveBalance} day(s)` : "—"}
//                 </TableCell>
//                 <TableCell>{getStatusBadge(request.status)}</TableCell>
//                 <TableCell>{new Date(request.appliedDate).toLocaleDateString()}</TableCell>
//                 <TableCell>
//                   <div className="flex space-x-2">
//                     {isHR && request.status === "pending" && (
//                       <>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="text-green-600 hover:text-green-700"
//                           onClick={() => handleApproveReject(request.id, "approved")}
//                         >
//                           <Check className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="text-destructive hover:text-destructive"
//                           onClick={() => handleApproveReject(request.id, "rejected")}
//                         >
//                           <X className="w-4 h-4" />
//                         </Button>
//                       </>
//                     )}
//                     {!isHR &&
//                       request.status === "pending" &&
//                       request.employeeId === (user?.employeeId || "") && (
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="text-destructive hover:text-destructive"
//                           onClick={() => handleCancel(request.id)}
//                         >
//                           <X className="w-4 h-4" /> Cancel
//                         </Button>
//                       )}
//                   </div>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </Card>

//       {filteredRequests.length === 0 && (
//         <div className="text-center py-12">
//           <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
//           <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
//           <p className="text-muted-foreground">Try adjusting your search or filters</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LeaveRequests;

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
import { Textarea } from "../components/ui/textarea";
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
  Plus,
  Filter,
  Check,
  X,
  Calendar,
  Clock,
  FileText,
  UserCheck,
  Gift,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { postActivity } from "../lib/postActivity";

const API_URL = import.meta.env.VITE_API_URL;

const LeaveRequests = () => {
  const { isHR, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGrantDialog, setShowGrantDialog] = useState(false);

  const API_BASE = API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const userId = user?.id || user?._id;

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [currentLeaveBalance, setCurrentLeaveBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [newLeave, setNewLeave] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDay: false,
  });

  const [grantLeave, setGrantLeave] = useState({
    employeeId: "",
    leaveType: "Compensatory Leave",
    days: 1,
    reason: "",
  });

  const statusOptions = ["all", "pending", "approved", "rejected"];
  const maxSickPersonal = 2;

  const sickUsed = leaveRequests.filter(
    (r) => r.leaveType === "Sick Leave" && r.status === "approved",
  ).length;
  const personalUsed = leaveRequests.filter(
    (r) => r.leaveType === "Personal Leave" && r.status === "approved",
  ).length;

  const leaveTypeOptions = [
    { value: "Annual Leave", label: "Annual Leave" },
    {
      value: "Sick Leave",
      label: `Sick Leave (${sickUsed}/${maxSickPersonal})`,
    },
    {
      value: "Personal Leave",
      label: `Personal Leave (${personalUsed}/${maxSickPersonal})`,
    },
    { value: "Maternity Leave", label: "Maternity Leave" },
    { value: "Paternity Leave", label: "Paternity Leave" },
    { value: "Casual Leave", label: "Casual Leave" },
    { value: "Earned Leave", label: "Earned Leave" },
    { value: "Study Leave", label: "Study Leave" },
    { value: "Compensatory Leave", label: "Compensatory Leave" },
  ];

  const toBackendType = (type) => {
    const map = {
      "Annual Leave": "vacation",
      "Sick Leave": "sick",
      "Personal Leave": "personal",
      "Maternity Leave": "maternity",
      "Paternity Leave": "paternity",
      "Casual Leave": "casual",
      "Earned Leave": "earned",
      "Study Leave": "study",
      "Compensatory Leave": "compensatory",
    };
    return map[type] || "personal";
  };

  const toFrontendType = (type) => {
    const map = {
      vacation: "Annual Leave",
      sick: "Sick Leave",
      personal: "Personal Leave",
      maternity: "Maternity Leave",
      paternity: "Paternity Leave",
      casual: "Casual Leave",
      earned: "Earned Leave",
      study: "Study Leave",
      compensatory: "Compensatory Leave",
    };
    return map[type] || type;
  };

  const formatDate = (date) => date.toISOString().slice(0, 10);

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const addMonths = (date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };

  const getAutoDatesForLeaveType = (type) => {
    const today = new Date();
    if (type === "Paternity Leave") {
      return {
        startDate: formatDate(today),
        endDate: formatDate(addDays(today, 5)),
      };
    }
    if (type === "Maternity Leave") {
      return {
        startDate: formatDate(today),
        endDate: formatDate(addMonths(today, 6)),
      };
    }
    return {};
  };

  const updateEndDateAutomatically = (startDate, leaveType) => {
    if (!startDate || !leaveType) return;
    const start = new Date(startDate);
    let newEndDate;
    if (leaveType === "Paternity Leave")
      newEndDate = formatDate(addDays(start, 5));
    else if (leaveType === "Maternity Leave")
      newEndDate = formatDate(addMonths(start, 6));
    else return;
    setNewLeave((prev) => ({ ...prev, endDate: newEndDate }));
  };

  const mapLeave = (l) => ({
    id: l._id,
    employeeId: l.employee?.employeeId || "",
    employeeName: l.employee?.name || "",
    profileImage: l.employee?.profileImage || "",
    avatar: l.employee?.avatar || "",
    leaveType: toFrontendType(l.type),
    startDate: l.startDate,
    endDate: l.endDate,
    duration: l.days,
    leaveBalance: l.employee?.leaveBalance ?? null,
    reason: l.reason,
    status: l.status,
    appliedDate: l.createdAt,
  });

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/leave`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = Array.isArray(res.data?.data) ? res.data.data : [];
      setLeaveRequests(items.map(mapLeave));
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to load leave requests",
      );
    }
  };

  const fetchCurrentEmployee = async () => {
    if (!token || !userId) return;
    setBalanceLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/employees/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentLeaveBalance(res.data?.data?.leaveBalance ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isHR) return;
    try {
      const res = await axios.get(`${API_BASE}/api/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employees");
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeaves();
      fetchCurrentEmployee();
      if (isHR) fetchEmployees();
    }
  }, [token, userId, isHR]);

  const calculateDuration = (startDate, endDate, isHalfDay) => {
    if (!startDate || !endDate) return 0;
    if (isHalfDay) return 0.5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const duration = calculateDuration(
    newLeave.startDate,
    newLeave.endDate,
    newLeave.isHalfDay,
  );
  const leaveDays = duration;

  const isSpecialLeave = ["Maternity Leave", "Paternity Leave"].includes(
    newLeave.leaveType,
  );
  const isRestrictedLeave = ["Sick Leave", "Personal Leave"].includes(
    newLeave.leaveType,
  );

  const projectedRemaining =
    currentLeaveBalance != null ? currentLeaveBalance - leaveDays : null;

  const formatDays = (days) => {
    if (days == null) return "—";
    return Number.isInteger(days) ? days : days.toFixed(1);
  };

  const normalRequests = leaveRequests.filter(
    (r) => !["Maternity Leave", "Paternity Leave"].includes(r.leaveType),
  );
  const pendingRequests = normalRequests.filter(
    (r) => r.status === "pending",
  ).length;
  const approvedRequests = normalRequests.filter(
    (r) => r.status === "approved",
  ).length;
  const totalRequests = normalRequests.length;

  const handleAddLeave = async () => {
    if (
      !newLeave.leaveType ||
      !newLeave.startDate ||
      !newLeave.endDate ||
      !newLeave.reason
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (newLeave.isHalfDay && newLeave.startDate !== newLeave.endDate) {
      toast.error("Half Day leave can only be applied for the same day");
      return;
    }

    if (isRestrictedLeave) {
      const used =
        newLeave.leaveType === "Sick Leave" ? sickUsed : personalUsed;
      const remaining = maxSickPersonal - used;

      if (used >= maxSickPersonal) {
        toast.error(
          `You have already used maximum ${maxSickPersonal} ${newLeave.leaveType}.`,
        );
        return;
      }
      if (leaveDays > remaining) {
        toast.error(
          `You can only take ${remaining} more day(s) of ${newLeave.leaveType}.`,
        );
        return;
      }
    }

    if (
      !isSpecialLeave &&
      projectedRemaining !== null &&
      projectedRemaining < 0
    ) {
      toast.error(
        `Insufficient leave balance! You only have ${formatDays(currentLeaveBalance)} day(s) left.`,
      );
      return;
    }

    try {
      const payload = {
        type: newLeave.isHalfDay
          ? "half_day"
          : toBackendType(newLeave.leaveType),
        startDate: newLeave.startDate,
        endDate: newLeave.endDate,
        reason: newLeave.reason,
      };

      await axios.post(`${API_BASE}/api/leave`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNewLeave({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
        isHalfDay: false,
      });
      setShowAddDialog(false);

      await fetchLeaves();
      await fetchCurrentEmployee();
      toast.success("Leave request submitted successfully!");

      postActivity({
        token,
        actor: user?.id || user?._id,
        action: "Submitted leave request",
        type: "leave",
        meta: { ...payload, isHalfDay: newLeave.isHalfDay },
      });
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to submit leave request",
      );
    }
  };

  const handleGrantLeave = async () => {
    if (!grantLeave.employeeId || !grantLeave.days || !grantLeave.reason) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/api/employees/${grantLeave.employeeId}/grant-leave`,
        {
          days: Number(grantLeave.days),
          type: toBackendType(grantLeave.leaveType),
          reason: grantLeave.reason,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const updatedBalance =
        res.data?.updatedBalance ??
        res.data?.leaveBalance ??
        res.data?.data?.leaveBalance;

      toast.success(
        `Leave composed successfully! Updated Balance: ${formatDays(updatedBalance)} day(s)`,
      );

      // Update local state
      setEmployees((prev) =>
        prev.map((emp) => {
          if (String(emp._id || emp.id) === String(grantLeave.employeeId)) {
            return { ...emp, leaveBalance: updatedBalance };
          }
          return emp;
        }),
      );

      if (String(grantLeave.employeeId) === String(userId)) {
        setCurrentLeaveBalance(updatedBalance);
      }

      setShowGrantDialog(false);
      setGrantLeave({
        employeeId: "",
        leaveType: "Compensatory Leave",
        days: 1,
        reason: "",
      });

      await Promise.all([
        fetchLeaves(),
        fetchCurrentEmployee(),
        fetchEmployees(),
      ]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to compose leave");
    }
  };

  const handleApproveReject = async (id, status) => {
    try {
      await axios.patch(
        `${API_BASE}/api/leave/${id}/review`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await fetchLeaves();
      await fetchCurrentEmployee();
      toast.success(`Leave request ${status} successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update request");
    }
  };

  const handleCancel = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/leave/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
      await fetchCurrentEmployee();
      toast.success("Leave request cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel request");
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: "secondary", label: "Pending", icon: Clock },
      approved: { variant: "default", label: "Approved", icon: Check },
      rejected: { variant: "destructive", label: "Rejected", icon: X },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch =
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leave Requests</h1>
          <p className="text-muted-foreground">
            {isHR
              ? "Manage employee leave requests"
              : "Submit and track your leave requests"}
          </p>
        </div>

        <div className="flex gap-3">
          {!isHR && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="btn-gradient w-60">
                  <Plus className="w-5 h-5 mr-2" />
                  Request Leave
                </Button>
              </DialogTrigger>

              <DialogContent style={{ maxHeight: "90vh", overflowY: "auto" }}>
                <DialogHeader>
                  <DialogTitle>Submit Leave Request</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your leave request
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <Select
                      value={newLeave.leaveType}
                      onValueChange={(value) => {
                        const autoDates = getAutoDatesForLeaveType(value);
                        setNewLeave({
                          ...newLeave,
                          leaveType: value,
                          ...autoDates,
                          isHalfDay: false,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypeOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newLeave.leaveType && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isHalfDay"
                        checked={newLeave.isHalfDay}
                        onChange={(e) => {
                          const isHalf = e.target.checked;
                          setNewLeave((prev) => ({
                            ...prev,
                            isHalfDay: isHalf,
                            endDate: isHalf ? prev.startDate : prev.endDate,
                          }));
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                      <Label htmlFor="isHalfDay" className="cursor-pointer">
                        Half Day Leave
                      </Label>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newLeave.startDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setNewLeave((prev) => ({
                          ...prev,
                          startDate: newStart,
                          endDate: prev.isHalfDay ? newStart : prev.endDate,
                        }));
                        updateEndDateAutomatically(
                          newStart,
                          newLeave.leaveType,
                        );
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newLeave.endDate}
                      onChange={(e) =>
                        setNewLeave((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      disabled={newLeave.isHalfDay}
                    />
                  </div>

                  {newLeave.startDate && newLeave.endDate && (
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-700 dark:text-green-400 font-semibold text-lg">
                        Duration:{" "}
                        <span className="text-3xl font-bold">
                          {formatDays(leaveDays)}
                        </span>{" "}
                        day(s)
                      </p>
                    </div>
                  )}

                  {isRestrictedLeave && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-blue-700 dark:text-blue-400 font-medium">
                        {newLeave.leaveType}:{" "}
                        {newLeave.leaveType === "Sick Leave"
                          ? sickUsed
                          : personalUsed}{" "}
                        / 2 used
                      </p>
                    </div>
                  )}

                  {currentLeaveBalance != null && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <p className="text-sm text-muted-foreground">
                          Remaining leave balance
                        </p>
                        {balanceLoading && (
                          <span className="text-xs text-muted-foreground">
                            Loading...
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-semibold">
                        {formatDays(currentLeaveBalance)} day(s)
                      </p>

                      {!isSpecialLeave && projectedRemaining !== null && (
                        <p
                          className={`mt-2 text-sm font-medium ${projectedRemaining < 0 ? "text-destructive" : "text-emerald-600"}`}
                        >
                          {projectedRemaining < 0
                            ? `Insufficient balance! You only have ${formatDays(currentLeaveBalance)} day(s)`
                            : `After this request: ${formatDays(projectedRemaining)} day(s) remaining`}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Please provide a reason for your leave..."
                      value={newLeave.reason}
                      onChange={(e) =>
                        setNewLeave({ ...newLeave, reason: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddLeave} className="btn-gradient">
                    Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isHR && (
            <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
              <DialogTrigger asChild>
                <Button className="btn-gradient">
                  <Gift className="w-5 h-5 mr-2" />
                  Compose Leave
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compose Leave</DialogTitle>
                  <DialogDescription>
                    Add leave balance to an employee (Single Selection)
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="employee">Select Employee</Label>
                    <Select
                      value={grantLeave.employeeId}
                      onValueChange={(value) =>
                        setGrantLeave((prev) => ({
                          ...prev,
                          employeeId: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select one employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem
                            key={emp._id || emp.id}
                            value={emp._id || emp.id}
                          >
                            {emp.name} ({emp.employeeId || "No ID"}) - Balance:{" "}
                            {emp.leaveBalance}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Leave Type</Label>
                    <Select
                      value={grantLeave.leaveType}
                      onValueChange={(value) =>
                        setGrantLeave((prev) => ({ ...prev, leaveType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypeOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="days">Number of Days</Label>
                    <Input
                      id="days"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={grantLeave.days}
                      onChange={(e) =>
                        setGrantLeave((prev) => ({
                          ...prev,
                          days: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason / Remarks</Label>
                    <Textarea
                      id="reason"
                      placeholder="Compensatory leave for extra hours / festival adjustment etc."
                      value={grantLeave.reason}
                      onChange={(e) =>
                        setGrantLeave((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowGrantDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleGrantLeave} className="btn-gradient">
                    Add to Leave Balance
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-4 mb-5">
        {isHR ? (
          <>
            <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
              <Card className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Requests
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRequests}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
              <Card className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Reviews
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    Require your attention
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
              <Card className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Approved Requests
                  </CardTitle>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{approvedRequests}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
              <Card className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Remaining Leave Balance
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {balanceLoading ? "..." : formatDays(currentLeaveBalance)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    available to use
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
              <Card className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sick Leave
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sickUsed} / 2</div>
                  <p className="text-xs text-muted-foreground">used</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px]">
              <Card className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Requests
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting approval
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="dashboard-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <div className="relative flex-1 min-w-full sm:min-w-[250px] md:min-w-[300px]">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-1 min-w-full sm:min-w-[220px]">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "all"
                        ? "All Status"
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card className="data-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={
                          request.profileImage ||
                          request.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(request.employeeName)}&background=0D8ABC&color=fff`
                        }
                        alt={request.employeeName}
                      />
                      <AvatarFallback>
                        {request.employeeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.employeeId}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{request.leaveType}</TableCell>
                <TableCell>
                  {new Date(request.startDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(request.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{request.duration} day(s)</TableCell>
                <TableCell>
                  {request.leaveBalance != null
                    ? `${request.leaveBalance} day(s)`
                    : "—"}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  {new Date(request.appliedDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {isHR && request.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() =>
                            handleApproveReject(request.id, "approved")
                          }
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            handleApproveReject(request.id, "rejected")
                          }
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {!isHR &&
                      request.status === "pending" &&
                      request.employeeId === (user?.employeeId || "") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleCancel(request.id)}
                        >
                          <X className="w-4 h-4" /> Cancel
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No leave requests found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;
