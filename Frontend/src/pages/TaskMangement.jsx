import { useState, useEffect } from "react";
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

const TaskManagement = () => {
  const { isHR, user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    category: "",
    description: "",
    assignedTo: "unassigned",
    endDateTime: new Date(Date.now() + 3600000),
    priority: "medium",
  });


  const marginStyle = {
    marginBottom: "10px"
  };

  const button = {
    width: "200px"
  };



  // Fetch Tasks and Employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const res = await axios.get(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.data) {
          const mappedTasks = res.data.data.map((t) => ({
            id: t._id,
            title: t.title,
            category: t.category,
            description: t.description || "",
            assignedTo: t.assignedTo?._id || t.assignedTo,
            assignedName: t.assignedTo?.name || "Unassigned",
            startDateTime: t.startDateTime
              ? new Date(t.startDateTime)
              : new Date(),
            endDateTime: t.endDateTime ? new Date(t.endDateTime) : new Date(),
            status: t.status || "pending",
            priority: t.priority || "medium",
          }));
          setTasks(mappedTasks);
        }

        const empRes = await axios.get(`${API_URL}/api/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (empRes.data?.data) setEmployees(empRes.data.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        toast.error("Failed to load tasks");
      }
    };

    fetchData();
  }, []);

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      task.title.toLowerCase().includes(q) ||
      task.assignedName.toLowerCase().includes(q);

    const matchesCategory =
      filterCategory === "all" || task.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

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

  const canEditTask = (task) => {
    if (isHR) return true;
    return task.assignedTo === user?._id;
  };

  // ==================== CREATE TASK ====================
  const handleCreateTask = async () => {
    if (!newTask.title?.trim()) {
      toast.error("Task Title is required");
      return;
    }
    if (!newTask.category) {
      toast.error("Please select a Category");
      return;
    }
    if (!newTask.endDateTime) {
      toast.error("End Date & Time is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const assignedToId =
        newTask.assignedTo === "unassigned" ? null : newTask.assignedTo;

      const payload = {
        title: newTask.title.trim(),
        category: newTask.category,
        description: newTask.description?.trim() || "",
        assignedTo: assignedToId,
        endDateTime: newTask.endDateTime.toISOString(),
        priority: newTask.priority,
      };

      const res = await axios.post(`${API_URL}/api/tasks`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.data) {
        const t = res.data.data;
        const mapped = {
          id: t._id,
          title: t.title,
          category: t.category,
          description: t.description || "",
          assignedTo: t.assignedTo?._id || t.assignedTo,
          assignedName: t.assignedTo?.name || "Unassigned",
          startDateTime: new Date(t.startDateTime),
          endDateTime: new Date(t.endDateTime),
          status: t.status || "pending",
          priority: t.priority || "medium",
        };

        setTasks([mapped, ...tasks]);
        setShowAddDialog(false);
        resetNewTask();
        toast.success("Task created successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== UPDATE TASK ====================
  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      const token = localStorage.getItem("authToken");
      const isEmployeeEditing = !isHR;
      const assignedToId =
        editingTask.assignedTo === "unassigned" ? null : editingTask.assignedTo;

      const payload = isEmployeeEditing
        ? {
            status: editingTask.status || "pending",
          }
        : {
            title: editingTask.title,
            category: editingTask.category,
            description: editingTask.description,
            assignedTo: assignedToId,
            endDateTime: editingTask.endDateTime.toISOString(),
            priority: editingTask.priority,
            status: editingTask.status || "pending",
          };

      const res = await axios.patch(
        `${API_URL}/api/tasks/${editingTask.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.data) {
        const updated = {
          ...editingTask,
          ...res.data.data,
          startDateTime: new Date(res.data.data.startDateTime),
          endDateTime: new Date(res.data.data.endDateTime),
        };
        setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
        setEditingTask(null);
        toast.success("Task updated successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task");
    }
  };

  // ==================== DELETE TASK ====================
  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${API_URL}/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTasks(tasks.filter((t) => t.id !== id));
      toast.success("Task deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const openEditDialog = (task) => {
    if (!canEditTask(task)) return;

    setEditingTask({
      ...task,
      assignedTo: task.assignedTo || "unassigned",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
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
          {/* <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Task
            </Button>
          </DialogTrigger> */}
            <DialogTrigger asChild style={{ ...marginStyle, ...button }}>
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Create New Task
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Create task and assign to any employee
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
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

              <div>
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
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>End Date & Time</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No tasks found</h3>
                  <p className="text-muted-foreground">
                    Try changing search or filter
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
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
                          {task.assignedName?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{task.assignedName}</span>
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
                      {task.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.status.toUpperCase()}</TableCell>
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
                          className="text-destructive hover:text-destructive"
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
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>

          {editingTask && (
            <div className="space-y-4 py-4">
              {!isHR && (
                <div className="rounded-lg border border-muted p-4 bg-muted/5 text-sm text-muted-foreground">
                  You can only update this task status.
                </div>
              )}

              <div>
                <Label>Task Title</Label>
                {isHR ? (
                  <Input
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
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
                {isHR ? (
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
                {isHR ? (
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
                {isHR ? (
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
                {isHR ? (
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
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description</Label>
                {isHR ? (
                  <textarea
                    className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md"
                    value={editingTask.description}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        description: e.target.value,
                      })
                    }
                  />
                ) : (
                  <div className="rounded-md border border-input bg-background px-3 py-2">
                    {editingTask.description || "No description provided."}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>Update Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManagement;
