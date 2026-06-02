import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
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
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  Briefcase,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../store/tasksSlice";

const API_URL = import.meta.env.VITE_API_URL;

const categories = [
  "Video Editing",
  "Interview",
  "Calling",
  "Developer",
  "SEO",
  "Design",
  "Multipurpose",
  "Backend",
  "Tender",
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const statusOptions = [
  { value: "all", label: "All Tasks" },
  { value: "pending", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const TaskManagement = () => {
  const { isHR, user } = useAuth();
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);

  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [taskView, setTaskView] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const prevTasksRef = useRef(new Map());
  const initialLoadRef = useRef(true);

  const [newTask, setNewTask] = useState({
    title: "",
    category: "",
    description: "",
    assignedTo: "unassigned",
    endDateTime: new Date(Date.now() + 3600000),
    priority: "medium",
  });

  // Notification for new task assignment
  useEffect(() => {
    if (!user) return;
    if (initialLoadRef.current) {
      prevTasksRef.current = new Map(
        tasks.map((task) => [task.id, String(task.assignedTo)]),
      );
      initialLoadRef.current = false;
      return;
    }

    tasks.forEach((task) => {
      const previousAssigned = prevTasksRef.current.get(task.id);
      if (
        String(task.assignedTo) === String(user._id) &&
        previousAssigned !== String(task.assignedTo)
      ) {
        toast.info(`A new task has been assigned to you: ${task.title}`);
      }
    });

    prevTasksRef.current = new Map(
      tasks.map((task) => [task.id, String(task.assignedTo)]),
    );
  }, [tasks, user]);

  // Fetch Data
  useEffect(() => {
    dispatch(fetchTasks());

    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const empRes = await axios.get(`${API_URL}/api/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (empRes.data?.data) setEmployees(empRes.data.data);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        toast.error("Failed to load tasks");
      }
    };

    fetchEmployees();
  }, [dispatch]);

  const normalizeEntityId = (entity) =>
    entity && typeof entity === "object"
      ? entity._id || entity.id || ""
      : entity || "";

  // Filtered & Paginated Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          !q ||
          task.title.toLowerCase().includes(q) ||
          task.assignedName.toLowerCase().includes(q) ||
          task.createdByName.toLowerCase().includes(q);

        const matchesCategory =
          filterCategory === "all" || task.category === filterCategory;
        const matchesStatus =
          filterStatus === "all" || task.status === filterStatus;
        const matchesView =
          taskView === "all"
            ? true
            : taskView === "assigned"
              ? String(normalizeEntityId(task.assignedTo)) === String(user?._id)
              : taskView === "created"
                ? String(normalizeEntityId(task.createdBy)) ===
                  String(user?._id)
                : true;

        return matchesSearch && matchesCategory && matchesStatus && matchesView;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, searchTerm, filterCategory, filterStatus, taskView, user?._id]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIdx, startIdx + itemsPerPage);

  const resetNewTask = () => {
    setNewTask({
      title: "",
      category: "",
      description: "",
      assignedTo: "unassigned",
      endDateTime: new Date(Date.now() + 3600000),
      priority: "medium",
    });
  };

  const isTaskCreator = (task) =>
    task &&
    user &&
    String(normalizeEntityId(task.createdBy)) === String(user._id);

  const isCreatorWithinEditWindow = (task) => {
    if (!task || !user || isHR) return false;
    if (!isTaskCreator(task)) return false;
    if (!task.createdAt) return false;
    return Date.now() - new Date(task.createdAt).getTime() < 5 * 60 * 1000;
  };

  const canEditTask = (task) =>
    isHR ||
    String(normalizeEntityId(task.assignedTo)) === String(user?._id) ||
    isCreatorWithinEditWindow(task);

  const canEmployeeEditDetails = (task) => {
    if (!task || !user || isHR) return false;
    const isAssigned =
      String(normalizeEntityId(task.assignedTo)) === String(user._id);
    const isCreator = isTaskCreator(task);
    if (!isAssigned && !isCreator) return false;
    if (!task.createdAt) return false;
    return Date.now() - new Date(task.createdAt).getTime() < 5 * 60 * 1000;
  };

  const canEmployeeUpdateTaskStatus = (task) =>
    !isHR &&
    task &&
    String(normalizeEntityId(task.assignedTo)) === String(user?._id);

  // Create Task
  const handleCreateTask = async () => {
    if (!newTask.title?.trim() || !newTask.category || !newTask.endDateTime) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const payload = {
        title: newTask.title.trim(),
        category: newTask.category,
        description: newTask.description?.trim() || "",
        assignedTo:
          newTask.assignedTo === "unassigned" ? null : newTask.assignedTo,
        endDateTime: newTask.endDateTime.toISOString(),
        priority: newTask.priority,
      };

      await dispatch(createTask(payload)).unwrap();
      setShowAddDialog(false);
      resetNewTask();
      toast.success("Task created successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Task
  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      const token = localStorage.getItem("authToken");
      const isEmployeeEditing = !isHR;
      const canEmployeeUpdateDetails =
        isEmployeeEditing && canEmployeeEditDetails(editingTask);
      const canEmployeeUpdateStatus =
        isEmployeeEditing && canEmployeeUpdateTaskStatus(editingTask);

      if (isEmployeeEditing && !canEmployeeUpdateStatus) {
        toast.error("You can no longer update status for a completed task.");
        return;
      }

      const assignedToId =
        editingTask.assignedTo === "unassigned" ? null : editingTask.assignedTo;

      const payload =
        isEmployeeEditing && !canEmployeeUpdateDetails
          ? { status: editingTask.status }
          : {
              title: editingTask.title,
              category: editingTask.category,
              description: editingTask.description,
              assignedTo: assignedToId,
              endDateTime: editingTask.endDateTime.toISOString(),
              priority: editingTask.priority,
              status: editingTask.status,
            };

      await dispatch(updateTask({ id: editingTask.id, payload })).unwrap();
      setEditingTask(null);
      toast.success("Task updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = localStorage.getItem("authToken");
      await dispatch(deleteTask(id)).unwrap();
      toast.success("Task deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const openEditDialog = (task) => {
    if (!canEditTask(task)) return;
    setEditingTask({ ...task, assignedTo: task.assignedTo || "unassigned" });
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Task Management
          </h1>
          <p className="text-muted-foreground">
            {isHR ? "Manage all team tasks" : "Create & Manage Tasks"}
          </p>
        </div>

        <Dialog
          open={showAddDialog}
          onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) resetNewTask();
          }}
        >
          <DialogTrigger asChild>
            <Button className="btn-gradient w-60">
              <Plus className="w-5 h-5 mr-2" />
              Create New Task
            </Button>
          </DialogTrigger>

          <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Create task and assign to any employee
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>
                  Task Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <Label>
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newTask.category}
                  onValueChange={(val) =>
                    setNewTask({ ...newTask, category: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(val) =>
                    setNewTask({ ...newTask, priority: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assign To</Label>
                <Select
                  value={newTask.assignedTo}
                  onValueChange={(val) =>
                    setNewTask({ ...newTask, assignedTo: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} {emp.employeeId ? `— ${emp.employeeId}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  End Date & Time <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  selected={newTask.endDateTime}
                  onChange={(date) =>
                    setNewTask({ ...newTask, endDateTime: date })
                  }
                  showTimeSelect
                  dateFormat="dd/MM/yyyy hh:mm aa"
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Description</Label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md resize-y"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Task details and notes..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <Tabs
            value={taskView}
            onValueChange={setTaskView}
            className="space-y-4"
          >
            <TabsList className="flex flex-wrap w-full gap-2">
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
              <TabsTrigger value="created">Created by Me</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by task title or employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[220px]">
                <Briefcase className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>End Date & Time</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No tasks found</h3>
                      <p className="text-muted-foreground">
                        Try changing search or filter
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {task.assignedName?.slice(0, 2).toUpperCase() ||
                                "??"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {task.assignedName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {task.createdByName?.slice(0, 2).toUpperCase() ||
                                "??"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {task.createdByName || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          {task.endDateTime.toLocaleDateString("en-IN")}
                          <Clock className="w-4 h-4 ml-1" />
                          {task.endDateTime.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {String(task.priority || "pending").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            String(task.status || "pending").toLowerCase() ===
                            "completed"
                              ? "bg-emerald-500 text-white"
                              : String(
                                    task.status || "pending",
                                  ).toLowerCase() === "inprogress"
                                ? "bg-blue-500 text-white"
                                : "bg-amber-500 text-black"
                          }
                        >
                          {String(task.status || "pending").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEditTask(task) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(task)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {isHR && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIdx + 1} to{" "}
                {Math.min(startIdx + itemsPerPage, filteredTasks.length)} of{" "}
                {filteredTasks.length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="px-4 py-2 border rounded-md bg-muted text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== EDIT TASK DIALOG ==================== */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>

          {editingTask && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {!isHR && !canEmployeeEditDetails(editingTask) && (
                  <div className="sm:col-span-2 rounded-lg border border-muted p-4 bg-muted/5 text-sm text-muted-foreground">
                    This task is assigned to you. You can update status anytime,
                    but full task details are editable only during the first 5
                    minutes.
                  </div>
                )}
                {!isHR && canEmployeeEditDetails(editingTask) && (
                  <div className="sm:col-span-2 rounded-lg border border-muted p-4 bg-muted/5 text-sm text-muted-foreground">
                    {String(editingTask.assignedTo) === String(user?._id)
                      ? "This task is assigned to you. You can edit task details for the first 5 minutes after creation."
                      : "This task was created by you. You can edit task details for the first 5 minutes after creation."}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <Label>Task Title</Label>
                  {isHR || canEmployeeEditDetails(editingTask) ? (
                    <Input
                      value={editingTask.title}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          title: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <div className="rounded-md border border-input bg-background px-3 py-2">
                      {editingTask.title}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Category</Label>
                  {isHR || canEmployeeEditDetails(editingTask) ? (
                    <Select
                      value={editingTask.category}
                      onValueChange={(val) =>
                        setEditingTask({ ...editingTask, category: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border border-input bg-background px-3 py-2">
                      {editingTask.category}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Priority</Label>
                  {isHR || canEmployeeEditDetails(editingTask) ? (
                    <Select
                      value={editingTask.priority}
                      onValueChange={(val) =>
                        setEditingTask({ ...editingTask, priority: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border border-input bg-background px-3 py-2">
                      {editingTask.priority}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Assign To</Label>
                  {isHR || canEmployeeEditDetails(editingTask) ? (
                    <Select
                      value={editingTask.assignedTo}
                      onValueChange={(val) =>
                        setEditingTask({ ...editingTask, assignedTo: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}{" "}
                            {emp.employeeId ? `— ${emp.employeeId}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border border-input bg-background px-3 py-2">
                      {editingTask.assignedName}
                    </div>
                  )}
                </div>

                <div>
                  <Label>End Date & Time</Label>
                  {isHR || canEmployeeEditDetails(editingTask) ? (
                    <DatePicker
                      selected={editingTask.endDateTime}
                      onChange={(date) =>
                        setEditingTask({ ...editingTask, endDateTime: date })
                      }
                      showTimeSelect
                      dateFormat="dd/MM/yyyy hh:mm aa"
                      className="w-full px-3 py-2 border border-input rounded-md"
                    />
                  ) : (
                    <div className="rounded-md border border-input bg-background px-3 py-2">
                      {editingTask.endDateTime.toLocaleDateString("en-IN")}{" "}
                      {editingTask.endDateTime.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Status</Label>
                  {isHR || canEmployeeUpdateTaskStatus(editingTask) ? (
                    <Select
                      value={editingTask.status}
                      onValueChange={(val) =>
                        setEditingTask({ ...editingTask, status: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inprogress">In Progress</SelectItem>
                        <SelectItem
                          className="bg-green-600 text-white"
                          value="completed"
                        >
                          Completed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border border-input bg-background px-3 py-2">
                      {String(editingTask.status || "pending").toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  {isHR || canEmployeeEditDetails(editingTask) ? (
                    <textarea
                      className="w-full min-h-[120px] px-3 py-2 border border-input rounded-md resize-y"
                      value={editingTask.description}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          description: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <div className="rounded-md border border-input bg-background px-3 py-2 min-h-[80px]">
                      {editingTask.description || "No description provided."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button
              className={
                editingTask?.status === "completed"
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : undefined
              }
              onClick={handleUpdateTask}
            >
              Update Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManagement;
