import Task from "../models/Task.js";
import Employee from "../models/Employee.js";
import transporter from "../Email/nodemailer.js";

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
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    // Allow HR always. Allow assigned employee. Also allow the creator
    // to edit within a 5-minute window after creation.
    const createdById = task.createdBy?.toString();
    const isCreator = createdById === userId.toString();
    const withinCreatorFullEditWindow =
      isCreator &&
      Date.now() - new Date(task.createdAt).getTime() < 5 * 60 * 1000;

    if (userRole !== "hr") {
      if (!isCreator && task.assignedTo?.toString() !== userId.toString()) {
        return res.status(403).json({
          status: false,
          message: "You don't have permission to update this task",
        });
      }
    }

    const previousAssignedTo = task.assignedTo?.toString() || null;
    const isEmployee = userRole !== "hr";
    const isAssignedEmployee =
      isEmployee && task.assignedTo?.toString() === userId.toString();
    const creator = await Employee.findById(task.createdBy);
    const isCreatedByJesh =
      String(creator?.name || "").toLowerCase() === "jesh";
    const withinEmployeeFullEditWindow =
      isAssignedEmployee &&
      Date.now() - new Date(task.createdAt).getTime() < 5 * 60 * 1000;

    const allowFullEdit =
      userRole === "hr" ||
      withinCreatorFullEditWindow ||
      withinEmployeeFullEditWindow;

    if (!allowFullEdit && isEmployee) {
      // Non-HR employees who are not inside full-edit window can only update status
      // and only for tasks assigned by Jesh.
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
            "Only the assigned employee can update task status after 5 minutes. Full details are editable only during the first 5 minutes.",
        });
      }
      if (!status || !["pending", "inprogress", "completed"].includes(status)) {
        return res.status(400).json({
          status: false,
          message: "Invalid status",
        });
      }
      if (!isCreatedByJesh) {
        return res.status(403).json({
          status: false,
          message:
            "Only tasks assigned by Jesh allow the assigned employee to update status.",
        });
      }
      task.status = status;
    } else {
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

    const newAssignedTo = populatedTask.assignedTo?._id.toString() || null;
    if (
      assignedTo !== undefined &&
      newAssignedTo &&
      newAssignedTo !== previousAssignedTo
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
      const isCreatedByJesh =
        String(task.createdBy?.name || "").toLowerCase() === "jesh";
      if (!isCreatedByJesh) {
        return res.status(403).json({
          status: false,
          message:
            "Only tasks assigned by Jesh allow the assigned employee to update status.",
        });
      }
    }

    task.status = status;
    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate("assignedTo", "name email profileImage")
      .populate("createdBy", "name email");

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
