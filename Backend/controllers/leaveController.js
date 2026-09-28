import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import {
  refreshEmployeeLeaveBalance,
  refreshEmployeeStatus,
} from "./employeeController.js";
import {
  getLeaveBalanceSummary,
  validateLeaveEligibility,
} from "../utils/leavePolicy.js";

// Create a new leave request (employee)
export const createLeave = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { type, startDate, endDate, reason, originalType } = req.body;
    if (!type || !startDate || !endDate || !reason) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required." });
    }
    const days =
      type === "half_day" &&
      ["sick", "personal", "plain"].includes(originalType)
        ? 0.5
        : type === "half_day"
          ? 1
          : Math.ceil(
              (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24),
            ) + 1;
    const employee = await Employee.findById(userId);
    if (!employee) {
      return res
        .status(404)
        .json({ status: false, message: "Employee not found." });
    }
    const existingLeaves = await Leave.find({ employee: userId });
    const eligibilityError = validateLeaveEligibility(
      employee,
      existingLeaves,
      {
        type,
        originalType,
        startDate,
        endDate,
        days,
      },
    );
    if (eligibilityError) {
      return res.status(400).json({ status: false, message: eligibilityError });
    }
    const leave = new Leave({
      employee: userId,
      type,
      originalType: type === "half_day" ? originalType : null,
      startDate,
      endDate,
      days,
      reason,
      medicalDocument: req.file
        ? {
            name: req.file.originalname,
            url: req.file.path,
            uploadedAt: new Date(),
          }
        : undefined,
      status: "pending",
    });
    await leave.save();
    const populated = await leave.populate([
      // include profileImage and leaveBalance so frontend can display remaining balance
      { path: "employee", select: "name employeeId profileImage leaveBalance" },
      { path: "manager", select: "name" },
    ]);
    return res.status(201).json({
      status: true,
      message: "Leave request submitted.",
      data: populated,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to submit leave request",
      error: err.message,
    });
  }
};

export const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const employee = await Employee.findById(userId);
    if (!employee) {
      return res
        .status(404)
        .json({ status: false, message: "Employee not found." });
    }
    const leaves = await Leave.find({ employee: userId });
    return res.status(200).json({
      status: true,
      data: getLeaveBalanceSummary(employee, leaves),
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to calculate leave balance",
      error: err.message,
    });
  }
};

export const uploadMedicalDocument = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const leave = await Leave.findOne({
      _id: req.params.id,
      employee: userId,
    });
    if (!leave) {
      return res
        .status(404)
        .json({ status: false, message: "Leave request not found." });
    }
    const isSickLeave =
      leave.type === "sick" ||
      (leave.type === "half_day" && leave.originalType === "sick");
    if (!isSickLeave) {
      return res.status(400).json({
        status: false,
        message:
          "Medical certificates can only be added to Sick Leave requests.",
      });
    }
    if (leave.status === "rejected") {
      return res.status(400).json({
        status: false,
        message: "A rejected leave request cannot be updated.",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "Please select a medical certificate PDF.",
      });
    }
    leave.medicalDocument = {
      name: req.file.originalname,
      url: req.file.path,
      uploadedAt: new Date(),
    };
    await leave.save();
    return res.status(200).json({
      status: true,
      message: "Medical certificate uploaded successfully.",
      data: leave,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to upload medical certificate",
      error: err.message,
    });
  }
};

// List all leave requests (HR) or my leave requests (employee)
export const listLeaves = async (req, res) => {
  try {
    const isHR = req.user?.role === "hr";
    let leaves;
    if (isHR) {
      leaves = await Leave.find()
        .populate("employee", "name employeeId profileImage leaveBalance")
        .populate("manager", "name")
        .sort({ createdAt: -1 });
      await Promise.all(
        leaves.map(async (leave) => {
          if (leave.employee) await refreshEmployeeLeaveBalance(leave.employee);
        }),
      );
    } else {
      leaves = await Leave.find({ employee: req.user?._id || req.user?.id })
        .populate("employee", "name employeeId profileImage leaveBalance")
        .populate("manager", "name")
        .sort({ createdAt: -1 });
      if (leaves[0]?.employee) {
        await refreshEmployeeLeaveBalance(leaves[0].employee);
      }
    }
    return res.status(200).json({ status: true, data: leaves });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch leave requests",
      error: err.message,
    });
  }
};

// Approve or reject a leave request (HR)
export const reviewLeave = async (req, res) => {
  try {
    if (req.user?.role !== "hr")
      return res.status(403).json({ status: false, message: "Forbidden" });
    const { id } = req.params;
    const { status, comments } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ status: false, message: "Invalid status" });
    }
    const leave = await Leave.findById(id);
    if (!leave)
      return res
        .status(404)
        .json({ status: false, message: "Leave request not found" });
    const previousStatus = leave.status;
    const employee = await Employee.findById(leave.employee);
    const isSickLeave =
      leave.type === "sick" ||
      (leave.type === "half_day" && leave.originalType === "sick");
    if (status === "approved" && isSickLeave && !leave.medicalDocument?.url) {
      return res.status(400).json({
        status: false,
        message:
          "Upload the medical certificate PDF before approving Sick Leave.",
      });
    }
    if (status === "approved" && employee && previousStatus !== "approved") {
      const existingLeaves = await Leave.find({
        employee: leave.employee,
        _id: { $ne: leave._id },
      });
      const eligibilityError = validateLeaveEligibility(
        employee,
        existingLeaves,
        {
          type: leave.type,
          originalType: leave.originalType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          days: leave.days,
        },
      );
      if (eligibilityError) {
        return res
          .status(400)
          .json({ status: false, message: eligibilityError });
      }
    }
    leave.status = status;
    leave.comments = comments || "";
    leave.approvalDate = new Date();
    leave.manager = req.user?._id || req.user?.id;
    await leave.save();

    try {
      if (employee) {
        if (status === "approved") {
          employee.status = "on_leave";
        }
        await refreshEmployeeLeaveBalance(employee);
        await employee.save();
        await refreshEmployeeStatus(employee);
      }
    } catch (e) {
      console.error(
        "Failed to update employee leave balance after leave review",
        e,
      );
    }

    const populated = await leave.populate([
      { path: "employee", select: "name employeeId profileImage leaveBalance" },
      { path: "manager", select: "name" },
    ]);
    return res
      .status(200)
      .json({ status: true, message: `Leave ${status}`, data: populated });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to review leave",
      error: err.message,
    });
  }
};

// Update a leave request (employee, only if pending)
export const updateLeave = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const { type, startDate, endDate, reason, originalType } = req.body;
    const leave = await Leave.findOne({
      _id: id,
      employee: userId,
      status: "pending",
    });
    if (!leave)
      return res
        .status(404)
        .json({ status: false, message: "Leave not found or not editable" });
    if (type) leave.type = type;
    if (type === "half_day" && originalType) leave.originalType = originalType;
    if (startDate) leave.startDate = startDate;
    if (endDate) leave.endDate = endDate;
    if (reason) leave.reason = reason;
    if (req.file) {
      leave.medicalDocument = {
        name: req.file.originalname,
        url: req.file.path,
        uploadedAt: new Date(),
      };
    }
    leave.days =
      leave.type === "half_day" &&
      ["sick", "personal", "plain"].includes(leave.originalType)
        ? 0.5
        : leave.type === "half_day"
          ? 1
          : Math.ceil(
              (new Date(leave.endDate) - new Date(leave.startDate)) /
                (1000 * 60 * 60 * 24),
            ) + 1;
    const employee = await Employee.findById(userId);
    const existingLeaves = await Leave.find({
      employee: userId,
      _id: { $ne: leave._id },
    });
    const eligibilityError = validateLeaveEligibility(
      employee,
      existingLeaves,
      {
        type: leave.type,
        originalType: leave.originalType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: leave.days,
      },
    );
    if (eligibilityError) {
      return res.status(400).json({ status: false, message: eligibilityError });
    }
    await leave.save();
    const populated = await leave.populate([
      { path: "employee", select: "name employeeId profileImage leaveBalance" },
      { path: "manager", select: "name" },
    ]);
    return res
      .status(200)
      .json({ status: true, message: "Leave updated", data: populated });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to update leave",
      error: err.message,
    });
  }
};

// Delete a leave request (employee, only if pending)
export const deleteLeave = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const leave = await Leave.findOneAndDelete({
      _id: id,
      employee: userId,
      status: "pending",
    });
    if (!leave)
      return res
        .status(404)
        .json({ status: false, message: "Leave not found or not deletable" });
    return res.status(200).json({ status: true, message: "Leave deleted" });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to delete leave",
      error: err.message,
    });
  }
};
