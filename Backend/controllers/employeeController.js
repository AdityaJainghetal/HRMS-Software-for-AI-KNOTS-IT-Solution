import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import Leave from "../models/Leave.js";
import getRemoveEmployeeMailOptions from "../Email/removeEmployee.js";
import bcrypt from "bcryptjs";
import transporter from "../Email/nodemailer.js";
import getAddEmployeeMailOptions from "../Email/addEmployee.js";
import { recalcDepartmentStats } from "../utils/departmentStats.js";
import redisClient from "../validation/RedisClient.js";

const EMPLOYEES_CACHE_KEY = "employees:all";
const EMPLOYEES_CACHE_TTL = 300; // seconds

const toId = (val) => {
  if (!val) return null;
  try {
    return typeof val === "string" ? val : String(val);
  } catch {
    return null;
  }
};
const getFinancialQuarterBounds = (date) => {
  const normalized = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const month = normalized.getMonth(); // 0 = Jan
  const year = normalized.getFullYear();

  const financialYearStartMonth = 3; // April

  // Financial year ke according month adjust
  const adjustedMonth = (month - financialYearStartMonth + 12) % 12;

  // Quarter index nikalega (0 to 3)
  const quarterIndex = Math.floor(adjustedMonth / 3);

  // Quarter start month
  const quarterStartMonth = (financialYearStartMonth + quarterIndex * 3) % 12;

  // Quarter year handle
  const quarterStartYear = month >= financialYearStartMonth ? year : year - 1;

  // Quarter start date
  const quarterStart = new Date(quarterStartYear, quarterStartMonth, 1);

  // Quarter end date
  const quarterEnd = new Date(quarterStartYear, quarterStartMonth + 3, 0);

  // Quarter Name
  const quarterNames = ["Q1", "Q2", "Q3", "Q4"];
  const quarterName = quarterNames[quarterIndex];

  return {
    quarterName,
    quarterStart,
    quarterEnd,
  };
};
// const getFinancialQuarterBounds = (date) => {
//   const normalized = new Date(
//     date.getFullYear(),
//     date.getMonth(),
//     date.getDate(),
//   );
//   const month = normalized.getMonth();
//   const year = normalized.getFullYear();
//   const financialYearStartMonth = 3; // April
//   const adjustedMonth = (month - financialYearStartMonth + 12) % 12;
//   const quarterIndex = Math.floor(adjustedMonth / 3);
//   const quarterStartMonth = (financialYearStartMonth + quarterIndex * 3) % 12;
//   const quarterStartYear = month >= financialYearStartMonth ? year : year - 1;
//   const quarterStart = new Date(quarterStartYear, quarterStartMonth, 1);
//   const quarterEnd = new Date(quarterStartYear, quarterStartMonth + 3, 0);
//   return { quarterStart, quarterEnd };
// };

const calculateQuarterlyLeaveAllocation = (joinDateValue, gender = "M") => {
  const joinDate = joinDateValue ? new Date(joinDateValue) : new Date();
  if (Number.isNaN(joinDate.getTime())) return 4;

  const { quarterStart, quarterEnd } = getFinancialQuarterBounds(joinDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const normalizedJoinDate = new Date(
    joinDate.getFullYear(),
    joinDate.getMonth(),
    joinDate.getDate(),
  );
  const remainingDays =
    Math.ceil((quarterEnd - normalizedJoinDate) / msPerDay) + 1;
  const quarterDays = Math.ceil((quarterEnd - quarterStart) / msPerDay) + 1;
  // Base allocation: 6 days per quarter
  let allocation = Math.ceil((remainingDays / quarterDays) * 6);
  // Add 1 extra day per quarter for females
  if (gender === "F" || gender === "female") {
    allocation += 1;
  }
  const maxDays = gender === "F" || gender === "female" ? 7 : 6;
  return Math.min(Math.max(allocation, 1), maxDays);
};

const getFinancialYearRange = (date) => {
  const normalized = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const year = normalized.getFullYear();
  const financialYearStartYear = normalized.getMonth() >= 3 ? year : year - 1;
  const financialYearStart = new Date(financialYearStartYear, 3, 1);
  const financialYearEnd = new Date(
    financialYearStartYear + 1,
    2,
    31,
    23,
    59,
    59,
    999,
  );
  return { financialYearStart, financialYearEnd };
};

const getQuarterAllocationForPeriod = (
  joinDate,
  quarterStart,
  quarterEnd,
  gender,
) => {
  const effectiveStart = joinDate > quarterStart ? joinDate : quarterStart;
  if (effectiveStart > quarterEnd) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  const remainingDays = Math.ceil((quarterEnd - effectiveStart) / msPerDay) + 1;
  const quarterDays = Math.ceil((quarterEnd - quarterStart) / msPerDay) + 1;

  let allocation = Math.ceil((remainingDays / quarterDays) * 6);
  if (gender === "F" || gender === "female") {
    allocation += 1;
  }
  const maxDays = gender === "F" || gender === "female" ? 7 : 6;
  return Math.min(Math.max(allocation, 1), maxDays);
};

const getLeaveOverlapDays = (leave, rangeStart, rangeEnd) => {
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const overlapStart = start > rangeStart ? start : rangeStart;
  const overlapEnd = end < rangeEnd ? end : rangeEnd;
  if (overlapEnd < overlapStart) return 0;
  if (leave.type === "half_day") return 0.5;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((overlapEnd - overlapStart) / msPerDay) + 1;
};

const getApprovedLeaveDays = async (employeeId, rangeStart, rangeEnd) => {
  const approvedLeaves = await Leave.find({
    employee: employeeId,
    status: "approved",
    endDate: { $gte: rangeStart },
    startDate: { $lte: rangeEnd },
  });

  return approvedLeaves.reduce(
    (sum, leave) => sum + getLeaveOverlapDays(leave, rangeStart, rangeEnd),
    0,
  );
};

const calculateLeaveBalanceForEmployee = async (
  employee,
  referenceDate = new Date(),
) => {
  const joinDate = employee.startDate
    ? new Date(employee.startDate)
    : new Date();
  if (Number.isNaN(joinDate.getTime())) return 0;

  const effectiveReferenceDate =
    joinDate > referenceDate ? joinDate : referenceDate;
  const { financialYearStart, financialYearEnd } = getFinancialYearRange(
    effectiveReferenceDate,
  );
  const effectiveStart =
    joinDate > financialYearStart ? joinDate : financialYearStart;
  if (effectiveStart > financialYearEnd) return 0;

  const currentQuarterStart = getFinancialQuarterBounds(
    effectiveReferenceDate,
  ).quarterStart;
  let quarterStart = getFinancialQuarterBounds(effectiveStart).quarterStart;
  if (quarterStart < financialYearStart) {
    quarterStart = financialYearStart;
  }

  let totalAllocation = 0;
  while (
    quarterStart <= currentQuarterStart &&
    quarterStart <= financialYearEnd
  ) {
    const quarterEnd = new Date(
      quarterStart.getFullYear(),
      quarterStart.getMonth() + 3,
      0,
    );
    totalAllocation += getQuarterAllocationForPeriod(
      effectiveStart,
      quarterStart,
      quarterEnd,
      employee.gender,
    );
    quarterStart = new Date(
      quarterStart.getFullYear(),
      quarterStart.getMonth() + 3,
      1,
    );
  }

  const approvedDays = await getApprovedLeaveDays(
    employee._id,
    effectiveStart,
    effectiveReferenceDate,
  );

  const adjustment = Number(employee.leaveAdjustment || 0);
  return Math.max(totalAllocation - approvedDays + adjustment, 0);
};

export const refreshEmployeeLeaveBalance = async (
  employee,
  referenceDate = new Date(),
) => {
  const calculated = await calculateLeaveBalanceForEmployee(
    employee,
    referenceDate,
  );
  if (employee.leaveBalance !== calculated) {
    employee.leaveBalance = calculated;
    await employee.save();
  }
  return calculated;
};

// export const grantLeave = async (req, res) => {
//   const { id } = req.params;
//   const { days, type, reason } = req.body;

//   try {
//     if (!days || Number(days) <= 0) {
//       return res
//         .status(400)
//         .json({
//           status: false,
//           message: "Please provide a valid number of days",
//         });
//     }
//     if (!type) {
//       return res
//         .status(400)
//         .json({ status: false, message: "Please provide a leave type" });
//     }
//     if (!reason) {
//       return res
//         .status(400)
//         .json({ status: false, message: "Please provide a reason" });
//     }

//     const employee = await Employee.findById(id);
//     if (!employee) {
//       return res
//         .status(404)
//         .json({ status: false, message: "Employee not found" });
//     }

//     const currentCalculated = await refreshEmployeeLeaveBalance(employee);
//     const grantedDays = Number(days);
//     const newBalance = (currentCalculated || 0) + grantedDays;
//     employee.leaveBalance = newBalance;
//     await employee.save();

//     const mapped = {
//       id: employee._id,
//       name: employee.name,
//       email: employee.email,
//       phone: employee.phone,
//       gender: employee.gender === "F" ? "female" : "male",
//       position: employee.position,
//       leaveBalance: employee.leaveBalance,
//       employeeId: employee.employeeId || String(employee._id),
//     };

//     return res.status(200).json({
//       status: true,
//       message: `Successfully granted ${grantedDays} day(s) to ${employee.name}`,
//       data: mapped,
//       grantedDays,
//       newBalance,
//     });
//   } catch (error) {
//     console.error("grantLeave error:", error);
//     return res
//       .status(500)
//       .json({
//         status: false,
//         message: "Internal server error: " + error.message,
//       });
//   }
// };
// controllers/leaveController.js  (or wherever your grantLeave is)

export const grantLeave = async (req, res) => {
  const { id } = req.params;
  const { days, type, reason } = req.body;

  try {
    if (!days || Number(days) <= 0) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid number of days",
      });
    }
    if (!type) {
      return res.status(400).json({
        status: false,
        message: "Please provide a leave type",
      });
    }
    if (!reason) {
      return res.status(400).json({
        status: false,
        message: "Please provide a reason",
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        status: false,
        message: "Employee not found",
      });
    }

    const grantedDays = Number(days);
    employee.leaveAdjustment =
      Number(employee.leaveAdjustment || 0) + grantedDays;
    await refreshEmployeeLeaveBalance(employee);
    const updatedBalance = employee.leaveBalance;

    await redisClient.safeDel(EMPLOYEES_CACHE_KEY);

    return res.status(200).json({
      status: true,
      message: `Successfully granted ${grantedDays} day(s) to ${employee.name}`,
      data: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId || "",
        leaveBalance: updatedBalance,
      },
      leaveBalance: updatedBalance,
      updatedBalance,
      grantedDays,
    });
  } catch (error) {
    console.error("grantLeave error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error: " + error.message,
    });
  }
};
export const getAllEmployees = async (req, res) => {
  try {
    const cached = await redisClient.safeGetJson(EMPLOYEES_CACHE_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return res.status(200).json({
        status: true,
        message: "Employees fetched successfully",
        data: cached,
        source: "redis",
      });
    }

    const employees = await Employee.find().populate({
      path: "department",
      select: "name",
    });
    if (!employees || employees.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No employees found",
      });
    }
    // Refresh leave balance for current financial year before returning employees
    const mapped = await Promise.all(
      employees.map(async (emp) => {
        await refreshEmployeeLeaveBalance(emp);
        return {
          id: emp._id,
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          gender: emp.gender === "F" ? "female" : "male",
          department: emp.department?.name || "",
          departmentId: emp.department?._id || null,
          position: emp.position,
          salary: emp.salary,
          leaveBalance: emp.leaveBalance,
          joinDate: emp.startDate
            ? emp.startDate.toISOString().split("T")[0]
            : "",
          status: emp.status,
          avatar:
            emp.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=3b82f6&color=fff`,
          address: emp.address,
          employeeId: emp.employeeId || "",
        };
      }),
    );
    await redisClient.safeSetJson(
      EMPLOYEES_CACHE_KEY,
      mapped,
      EMPLOYEES_CACHE_TTL,
    );

    res.status(200).json({
      status: true,
      message: "Employees fetched successfully",
      data: mapped,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error: " + error,
    });
  }
};

export const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const emp = await Employee.findById(id).populate({
      path: "department",
      select: "name",
    });
    if (!emp) {
      return res.status(404).json({
        status: false,
        message: "Employee not found",
      });
    }
    // Refresh leave balance for current financial year before returning the employee
    await refreshEmployeeLeaveBalance(emp);
    const mapped = {
      id: emp._id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      gender: emp.gender === "F" ? "female" : "male",
      department: emp.department?.name || "",
      departmentId: emp.department?._id || null,
      position: emp.position,
      salary: emp.salary,
      leaveBalance: emp.leaveBalance,
      joinDate: emp.startDate ? emp.startDate.toISOString().split("T")[0] : "",
      dateOfBirth: emp.dateOfBirth
        ? emp.dateOfBirth.toISOString().split("T")[0]
        : "",
      experience: emp.experience || "",
      college: emp.college || "",
      bio: emp.bio || "",
      skills: emp.skills || "",
      emergencyContact: emp.emergencyContact || "",
      status: emp.status,
      avatar:
        emp.profileImage ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=3b82f6&color=fff`,
      address: emp.address,
      employeeId: emp.employeeId || "",
    };
    res.status(200).json({
      status: true,
      message: "Employee fetched successfully",
      data: mapped,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error: " + error,
    });
  }
};

// Convert frontend gender format to backend format
const normalizeGender = (gender) => {
  if (!gender) return "M";
  const normalized = gender.toLowerCase();
  if (normalized === "female" || normalized === "f") return "F";
  if (normalized === "male" || normalized === "m") return "M";
  return "M"; // default to male
};

export const createEmployee = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    department, // accept name or id (legacy)
    departmentId, // preferred id
    salary,
    position,
    joinDate,
    address,
    status,
    employeeId,
    avatar,
    gender,
  } = req.body;

  try {
    if (!name || !email || !password || (!department && !departmentId)) {
      return res
        .status(400)
        .json({ status: false, message: "Please fill in all required fields" });
    }

    if (await Employee.exists({ email })) {
      return res.status(400).json({
        status: false,
        message: "Employee with this email already exists",
      });
    }

    // Resolve department ID
    let depDoc = null;
    if (departmentId) {
      depDoc = await Department.findById(departmentId);
    } else if (department) {
      depDoc = await Department.findOne({ name: department });
    }
    if (!depDoc) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid department" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const normalizedGender = normalizeGender(gender);
    const initialLeaveBalance = calculateQuarterlyLeaveAllocation(
      joinDate,
      normalizedGender,
    );

    const user = new Employee({
      name,
      email,
      password: hashedPassword,
      phone,
      gender: normalizedGender,
      department: depDoc._id,
      salary,
      position,
      address,
      status: status || "active",
      leaveBalance: initialLeaveBalance,
      employeeId,
      profileImage: avatar,
      startDate: joinDate,
    });

    await user.save();
    await refreshEmployeeLeaveBalance(user);

    // Invalidate employee list cache because new employee is added
    await redisClient.safeDel(EMPLOYEES_CACHE_KEY);

    // Increment department employee count
    await Department.findByIdAndUpdate(depDoc._id, {
      $inc: { employeeCount: 1 },
    });
    // Recalculate average salary for department
    await recalcDepartmentStats(depDoc._id);

    transporter.sendMail(
      getAddEmployeeMailOptions(
        user.email,
        user.name,
        user.position,
        depDoc.name,
        user.salary,
        password,
      ),
      (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Email sent:", info.response);
        }
      },
    );
    // Map to frontend shape
    const mapped = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender === "F" ? "female" : "male",
      department: depDoc.name,
      departmentId: depDoc._id,
      position: user.position,
      salary: user.salary,
      leaveBalance: user.leaveBalance,
      joinDate: user.startDate
        ? user.startDate.toISOString().split("T")[0]
        : "",
      status: user.status,
      avatar:
        user.profileImage ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`,
      address: user.address,
      employeeId: user.employeeId || "",
    };
    res.status(201).json({
      status: true,
      message: "Employee created successfully",
      data: mapped,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: false, message: "Internal server error: " + error });
  }
};

export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    dateOfBirth,
    address,
    bio,
    skills,
    experience,
    college,
    emergencyContact,
    emergencyPhone,
  } = req.body;
  try {
    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        name,
        email,
        phone,
        dateOfBirth,
        address,
        bio,
        skills,
        experience,
        college,
        emergencyContact,
        emergencyPhone,
      },
      { new: true },
    );
    if (!employee) {
      return res
        .status(404)
        .json({ status: false, message: "Employee not found" });
    }
    await redisClient.safeDel(EMPLOYEES_CACHE_KEY);
    res.status(200).json({
      status: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: false, message: "Internal server error: " + error });
  }
};

export const editEmployee = async (req, res) => {
  const {
    name,
    email,
    phone,
    department,
    departmentId,
    salary,
    position,
    address,
    experience,
    college,
    status,
    employeeId,
    avatar,
    joinDate,
    gender,
  } = req.body;
  const { id } = req.params;
  try {
    const prev = await Employee.findById(id).populate("department");
    if (!prev) {
      return res
        .status(404)
        .json({ status: false, message: "Employee not found" });
    }

    // Resolve department
    let newDeptDoc = prev.department; // default keep
    if (departmentId || department) {
      if (departmentId) newDeptDoc = await Department.findById(departmentId);
      else if (department)
        newDeptDoc = await Department.findOne({ name: department });
      if (!newDeptDoc)
        return res
          .status(400)
          .json({ status: false, message: "Invalid department" });
    }

    const oldDeptId = prev.department?._id?.toString();
    const newDeptId = newDeptDoc?._id?.toString();

    const normalizedGender = gender ? normalizeGender(gender) : prev.gender;

    const shouldRecalculateLeave =
      (joinDate &&
        (!prev.startDate ||
          prev.startDate.toISOString().split("T")[0] !== joinDate)) ||
      (gender && normalizedGender !== prev.gender);

    const emp = await Employee.findByIdAndUpdate(
      id,
      {
        name,
        email,
        phone,
        gender: normalizedGender,
        department: newDeptDoc?._id || prev.department,
        salary,
        position,
        address,
        experience,
        college,
        status,
        employeeId,
        profileImage: avatar,
        startDate: joinDate || prev.startDate,
        ...(shouldRecalculateLeave && {
          leaveBalance: calculateQuarterlyLeaveAllocation(
            joinDate || prev.startDate,
            normalizedGender,
          ),
        }),
      },
      { new: true },
    ).populate("department");

    if (emp) {
      await refreshEmployeeLeaveBalance(emp);
    }

    if (!emp) {
      return res
        .status(404)
        .json({ status: false, message: "Employee not found" });
    }

    await redisClient.safeDel(EMPLOYEES_CACHE_KEY);

    // Adjust department counts if changed
    if (oldDeptId && newDeptId && oldDeptId !== newDeptId) {
      await Department.findByIdAndUpdate(oldDeptId, {
        $inc: { employeeCount: -1 },
      });
      await Department.findByIdAndUpdate(newDeptId, {
        $inc: { employeeCount: 1 },
      });
      // Recalc both departments' stats when moving
      await recalcDepartmentStats(oldDeptId);
      await recalcDepartmentStats(newDeptId);
    }
    // If salary changed but department same, still recalc current department
    if (newDeptId && oldDeptId === newDeptId && salary !== undefined) {
      await recalcDepartmentStats(newDeptId);
    }

    // Map to frontend shape
    const mapped = {
      id: emp._id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      gender: emp.gender === "F" ? "female" : "male",
      department: emp.department?.name || "",
      departmentId: emp.department?._id || null,
      position: emp.position,
      salary: emp.salary,
      leaveBalance: emp.leaveBalance,
      joinDate: emp.startDate ? emp.startDate.toISOString().split("T")[0] : "",
      status: emp.status,
      avatar:
        emp.profileImage ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=3b82f6&color=fff`,
      address: emp.address,
      employeeId: emp.employeeId || "",
    };
    res.status(200).json({
      status: true,
      message: "Employee updated successfully",
      data: mapped,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: false, message: "Internal server error: " + error });
  }
};

export const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const emp = await Employee.findById(id).populate("department");
    if (!emp) {
      return res
        .status(404)
        .json({ status: false, message: "Employee not found" });
    }
    // Send removal email before deleting
    transporter.sendMail(
      getRemoveEmployeeMailOptions(
        emp.email,
        emp.name,
        emp.position,
        emp.department?.name || "",
      ),
      (err, info) => {
        if (err) {
          console.error("Error sending removal email:", err);
        } else {
          console.log("Removal email sent:", info.response);
        }
      },
    );

    await Employee.findByIdAndDelete(id);
    await redisClient.safeDel(EMPLOYEES_CACHE_KEY);

    // Decrement department employee count
    if (emp.department?._id) {
      await Department.findByIdAndUpdate(emp.department._id, {
        $inc: { employeeCount: -1 },
      });
      await recalcDepartmentStats(emp.department._id);
    }

    // Map to frontend shape
    const mapped = {
      id: emp._id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      gender: emp.gender === "F" ? "female" : "male",
      department: emp.department?.name || "",
      departmentId: emp.department?._id || null,
      position: emp.position,
      salary: emp.salary,
      leaveBalance: emp.leaveBalance,
      joinDate: emp.startDate ? emp.startDate.toISOString().split("T")[0] : "",
      status: emp.status,
      avatar:
        emp.profileImage ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=3b82f6&color=fff`,
      address: emp.address,
      employeeId: emp.employeeId || "",
    };
    res.status(200).json({
      status: true,
      message: "Employee deleted successfully",
      data: mapped,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: false, message: "Internal server error: " + error });
  }
};

export const resumeUpload = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ status: false, message: "No file uploaded" });
  }

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ status: false, message: "Employee not found" });
    }

    // multer-storage-cloudinary already returns Cloudinary URL in file.path
    employee.resume = {
      name: req.file.originalname,
      type: req.file.mimetype,
      url: req.file.path, // Cloudinary secure URL
      uploadDate: Date.now(),
    };

    await employee.save();

    res.status(200).json({
      status: true,
      message: "Resume uploaded successfully",
      data: employee.resume,
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Upload profile image and save Cloudinary URL to employee.profileImage
export const profileUpload = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ status: false, message: "No file uploaded" });
  }

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ status: false, message: "Employee not found" });
    }

    // multer-storage-cloudinary may set different properties depending on version.
    // Try common locations for the uploaded file URL.
    const file = req.file;
    console.log(
      "profileUpload: received file:",
      file && {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: file.url,
        secure_url: file.secure_url,
        location: file.location,
      },
    );

    const url =
      file?.path || file?.secure_url || file?.url || file?.location || null;
    if (!url) {
      console.error(
        "profileUpload: could not determine uploaded file URL",
        file,
      );
      return res.status(500).json({
        status: false,
        message: "Uploaded but failed to determine Cloudinary URL",
        file,
      });
    }

    employee.profileImage = url;
    await employee.save();

    // re-fetch to populate relations and ensure fresh data
    const saved = await Employee.findById(id).populate({
      path: "department",
      select: "name",
    });
    console.log("profileUpload: saved profileImage=", saved.profileImage);

    // Return mapped employee (frontend expects 'avatar' in some endpoints)
    const mapped = {
      id: saved._id,
      name: saved.name,
      email: saved.email,
      phone: saved.phone,
      gender: saved.gender === "F" ? "female" : "male",
      department: saved.department?.name || "",
      departmentId: saved.department?._id || null,
      position: saved.position,
      salary: saved.salary,
      leaveBalance: saved.leaveBalance,
      joinDate: saved.startDate
        ? saved.startDate.toISOString().split("T")[0]
        : "",
      status: saved.status,
      avatar:
        saved.profileImage ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(saved.name)}&background=3b82f6&color=fff`,
      address: saved.address,
      employeeId: saved.employeeId || "",
    };

    res
      .status(200)
      .json({ status: true, message: "Profile image uploaded", data: mapped });
  } catch (error) {
    console.error("Profile upload error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
