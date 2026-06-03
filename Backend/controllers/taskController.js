import Task from "../models/Task.js";
import Employee from "../models/Employee.js";
import transporter from "../Email/nodemailer.js";
import redisClient from "../validation/RedisClient.js";

const TASKS_CACHE_TTL = 300;
const TASKS_CACHE_HR_KEY = "tasks:all:hr";
const TASKS_CACHE_USER_KEY_PREFIX = "tasks:user:";
const getTaskCacheKey = (userId, role) =>
  role === "hr"
    ? TASKS_CACHE_HR_KEY
    : `${TASKS_CACHE_USER_KEY_PREFIX}${userId}`;

const sendTaskAssignedEmail = async (employee, task, creatorName) => {
  if (!employee?.email) return;

  const mailOptions = {
    from: process.env.EMAIL,
    to: employee.email,
    subject: `New Task Assigned: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Task Assigned to You</h2>
        <p>Hi ${employee.name},</p>
        <p>A new task has been assigned to you.</p>
        <ul>
          <li><strong>Title:</strong> ${task.title}</li>
          <li><strong>Category:</strong> ${task.category}</li>
          <li><strong>Priority:</strong> ${task.priority || "medium"}</li>
          <li><strong>Due:</strong> ${new Date(task.endDateTime).toLocaleString()}</li>
          <li><strong>Assigned by:</strong> ${creatorName || "HR Team"}</li>
        </ul>
        <p>${task.description || "No additional details provided."}</p>
        <p>Thank you,<br/>HRMS System</p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Failed to send task assignment email:", err);
    } else {
      console.log("Task assignment email sent:", info.response);
    }
  });
};

// Get all tasks (HR sees all, Employee sees tasks assigned to or created by them)
export const getAllTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const cacheKey = getTaskCacheKey(userId, userRole);
    const cached = await redisClient.safeGetJson(cacheKey);
    if (cached && Array.isArray(cached)) {
      return res.status(200).json({
        status: true,
        message: "Tasks fetched successfully",
        data: cached,
        source: "redis",
      });
    }

    let query = {};

    // If user is not HR, filter tasks assigned to them or created by them
    if (userRole !== "hr") {
      query = {
        $or: [{ assignedTo: userId }, { createdBy: userId }],
      };
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email profileImage")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    await redisClient.safeSetJson(cacheKey, tasks, TASKS_CACHE_TTL);

    res.status(200).json({
      status: true,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to fetch tasks: " + error.message,
    });
  }
};

// Get single task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const task = await Task.findById(id)
      .populate("assignedTo", "name email profileImage")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    // Check if user has permission to view this task
    if (
      userRole !== "hr" &&
      task.assignedTo?._id.toString() !== userId.toString() &&
      task.createdBy?._id.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        status: false,
        message: "You don't have permission to view this task",
      });
    }

    res.status(200).json({
      status: true,
      message: "Task fetched successfully",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to fetch task: " + error.message,
    });
  }
};

// Create task
// export const createTask = async (req, res) => {
//   try {
//     const { title, category, description, assignedTo, dateTime } = req.body;
//     const createdBy = req.user._id;
//     const userRole = req.user.role;

//     // Validate required fields
//     if (!title || !category) {
//       return res.status(400).json({
//         status: false,
//         message: "Title and category are required",
//       });
//     }

//     // If user is employee, they can only create tasks for themselves
//     let finalAssignedTo = assignedTo;
//     if (userRole !== "hr") {
//       finalAssignedTo = createdBy;
//     }

//     // If no assignedTo provided and user is employee, auto-assign to themselves
//     if (!finalAssignedTo && userRole !== "hr") {
//       finalAssignedTo = createdBy;
//     }

//     // Validate that assignedTo employee exists (if provided)
//     if (finalAssignedTo) {
//       const employee = await Employee.findById(finalAssignedTo);
//       if (!employee) {
//         return res.status(400).json({
//           status: false,
//           message: "Assigned employee not found",
//         });
//       }
//     }

//     const task = new Task({
//       title,
//       category,
//       description: description || "",
//       assignedTo: finalAssignedTo || null,
//       dateTime,
//       createdBy,
//     });

//     const savedTask = await task.save();

//     const populatedTask = await Task.findById(savedTask._id)
//       .populate("assignedTo", "name email profileImage")
//       .populate("createdBy", "name email");

//     res.status(201).json({
//       status: true,
//       message: "Task created successfully",
//       data: populatedTask,
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: false,
//       message: "Failed to create task: " + error.message,
//     });
//   }
// };
export const createTask = async (req, res) => {
  try {
    const { title, category, description, assignedTo, endDateTime, priority } =
      req.body;
    const createdBy = req.user._id;
    const userRole = req.user.role;

    if (!title || !category || !endDateTime) {
      return res.status(400).json({
        status: false,
        message: "Title, category and end date-time are required",
      });
    }

    let finalAssignedTo = assignedTo && assignedTo !== "" ? assignedTo : null;
    if (!finalAssignedTo && userRole !== "hr") {
      finalAssignedTo = createdBy;
    }

    if (finalAssignedTo) {
      const employee = await Employee.findById(finalAssignedTo);
      if (!employee) {
        return res.status(400).json({
          status: false,
          message: "Assigned employee not found",
        });
      }
    }

    const task = new Task({
      title,
      category,
      description: description || "",
      assignedTo: finalAssignedTo || null,
      createdBy,
      startDateTime: new Date(), // Auto set from backend
      endDateTime: new Date(endDateTime),
      priority: priority || "medium",
    });

    const savedTask = await task.save();

    const populatedTask = await Task.findById(savedTask._id)
      .populate("assignedTo", "name email profileImage")
      .populate("createdBy", "name email");

    await redisClient.safeDel(TASKS_CACHE_HR_KEY);
    await redisClient.safeDel(`${TASKS_CACHE_USER_KEY_PREFIX}${createdBy}`);
    if (finalAssignedTo) {
      await redisClient.safeDel(
        `${TASKS_CACHE_USER_KEY_PREFIX}${finalAssignedTo}`,
      );
    }

    if (populatedTask.assignedTo) {
      await sendTaskAssignedEmail(
        populatedTask.assignedTo,
        populatedTask,
        populatedTask.createdBy?.name,
      );
    }

    res.status(201).json({
      status: true,
      message: "Task created successfully",
      data: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to create task: " + error.message,
    });
  }
};
// Update task (HR and creator can update)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      description,
      assignedTo,
      endDateTime,
      status,
      priority,
    } = req.body;

    const userId = req.user._id;
    const userRole = req.user.role;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    const oldAssignedTo = task.assignedTo?.toString() || null;
    const oldCreatedBy = task.createdBy?.toString() || null;

    const createdById = task.createdBy?.toString();
    const assignedToId = task.assignedTo?.toString();

    const isCreator = createdById === userId.toString();
    const isAssignedEmployee = assignedToId === userId.toString();
    const isHR = userRole === "hr";

    const isWithin5Min = (date) => {
      return Date.now() - new Date(date).getTime() < 5 * 60 * 1000;
    };

    const withinCreatorWindow = isCreator && isWithin5Min(task.createdAt);
    const withinAssignedWindow =
      isAssignedEmployee && isWithin5Min(task.createdAt);

    // Permission Check
    if (!isHR && !isCreator && !isAssignedEmployee) {
      return res.status(403).json({
        status: false,
        message: "You don't have permission to update this task",
      });
    }

    // Decide if full edit is allowed
    const allowFullEdit = isHR || withinCreatorWindow || withinAssignedWindow;

    // === Restricted Mode (After 5 minutes for employees) ===
    if (!allowFullEdit) {
      // Only status update allowed
      if (
        title ||
        category ||
        description !== undefined ||
        endDateTime ||
        priority ||
        assignedTo !== undefined
      ) {
        return res.status(403).json({
          status: false,
          message:
            "Full task details are editable only during the first 5 minutes. You can only update status now.",
        });
      }

      if (!status || !["pending", "inprogress", "completed"].includes(status)) {
        return res.status(400).json({
          status: false,
          message: "Invalid status value",
        });
      }

      task.status = status;
    }
    // === Full Edit Mode ===
    else {
      if (title) task.title = title;
      if (category) task.category = category;
      if (description !== undefined) task.description = description;
      if (endDateTime) task.endDateTime = new Date(endDateTime);
      if (priority) task.priority = priority;

      if (status && ["pending", "inprogress", "completed"].includes(status)) {
        task.status = status;
      }

      if (assignedTo !== undefined) {
        if (assignedTo && assignedTo !== "") {
          const employee = await Employee.findById(assignedTo);
          if (!employee) {
            return res.status(400).json({
              status: false,
              message: "Assigned employee not found",
            });
          }
          task.assignedTo = assignedTo;
        } else {
          task.assignedTo = null;
        }
      }
    }

    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate("assignedTo", "name email profileImage")
      .populate("createdBy", "name email");

    const newAssignedTo = populatedTask.assignedTo?._id?.toString() || null;
    await redisClient.safeDel(TASKS_CACHE_HR_KEY);
    if (oldCreatedBy) {
      await redisClient.safeDel(
        `${TASKS_CACHE_USER_KEY_PREFIX}${oldCreatedBy}`,
      );
    }
    if (oldAssignedTo) {
      await redisClient.safeDel(
        `${TASKS_CACHE_USER_KEY_PREFIX}${oldAssignedTo}`,
      );
    }
    if (newAssignedTo) {
      await redisClient.safeDel(
        `${TASKS_CACHE_USER_KEY_PREFIX}${newAssignedTo}`,
      );
    }

    // Send email if task is reassigned
    if (
      assignedTo !== undefined &&
      newAssignedTo &&
      newAssignedTo !== oldAssignedTo
    ) {
      await sendTaskAssignedEmail(
        populatedTask.assignedTo,
        populatedTask,
        populatedTask.createdBy?.name,
      );
    }

    res.status(200).json({
      status: true,
      message: "Task updated successfully",
      data: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to update task: " + error.message,
    });
  }
};
// Delete task (HR only)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    if (userRole !== "hr") {
      return res.status(403).json({
        status: false,
        message: "Only HR can delete tasks",
      });
    }

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    await redisClient.safeDel(TASKS_CACHE_HR_KEY);
    if (task.createdBy) {
      await redisClient.safeDel(
        `${TASKS_CACHE_USER_KEY_PREFIX}${task.createdBy.toString()}`,
      );
    }
    if (task.assignedTo) {
      await redisClient.safeDel(
        `${TASKS_CACHE_USER_KEY_PREFIX}${task.assignedTo.toString()}`,
      );
    }

    res.status(200).json({
      status: true,
      message: "Task deleted successfully",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to delete task: " + error.message,
    });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    if (!["pending", "inprogress", "completed"].includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Invalid status",
      });
    }

    const task = await Task.findById(id).populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    // Only HR or the assigned employee can change task status directly.
    if (userRole !== "hr") {
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: false,
          message: "Only HR or the assigned employee can update task status",
        });
      }
    }

    task.status = status;
    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate("assignedTo", "name email profileImage")
      .populate("createdBy", "name email");

    await redisClient.safeDel(TASKS_CACHE_HR_KEY);
    if (task.createdBy) {
      await redisClient.safeDel(
        `${TASKS_CACHE_USER_KEY_PREFIX}${task.createdBy.toString()}`,
      );
    }
    if (task.assignedTo) {
      await redisClient.safeDel(
        `${TASKS_CACHE_USER_KEY_PREFIX}${task.assignedTo.toString()}`,
      );
    }

    res.status(200).json({
      status: true,
      message: "Task status updated successfully",
      data: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to update task status: " + error.message,
    });
  }
};
