// import Attendance from '../models/Attendance.js';
// import Employee from '../models/Employee.js';
// import Department from '../models/Department.js';
// import DailyAttendance from '../models/DailyAttendance.js';
// import Activity from '../models/Activity.js';

// // Map DB doc to frontend shape used in Attendance.jsx
// const mapRecord = (rec, empDoc) => {
//   const emp = empDoc || rec.employee;
//   const fullName = emp?.name || '';
//   const departmentName = emp?.department?.name || '';
//   return {
//     id: rec._id,
//     employeeId: emp?.employeeId || (emp?._id?.toString() || ''),
//     employeeName: fullName,
//     avatar: emp?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff`,
//     department: departmentName,
//     date: new Date(rec.date).toISOString().split('T')[0],
//     checkIn: rec.checkIn,
//     checkOut: rec.checkOut,
//     workingHours: computeWorkingHours(rec.checkIn, rec.checkOut),
//     status: rec.status,
//     location: rec.location,
//   };
// };

// const computeWorkingHours = (checkIn, checkOut) => {
//   if (!checkIn && !checkOut) return '0h 00m';
//   if (checkIn && !checkOut) return '0h 00m'; // ongoing; frontend can special-case
//   try {
//     const [h1, m1] = String(checkIn).split(':').map(Number);
//     const [h2, m2] = String(checkOut).split(':').map(Number);
//     let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
//     if (isNaN(mins) || mins < 0) mins = 0;
//     const h = Math.floor(mins / 60);
//     const m = mins % 60;
//     return `${h}h ${String(m).padStart(2, '0')}m`;
//   } catch {
//     return '0h 00m';
//   }
// };

// const WORK_START_TIME = process.env.WORK_START_TIME || '09:00'; // HH:MM 24h

// // normalize a date to the start/end of day
// const dayBounds = (dateLike) => {
//   const d = new Date(dateLike);
//   const start = new Date(d); start.setHours(0,0,0,0);
//   const end = new Date(d); end.setHours(23,59,59,999);
//   return { start, end };
// };

// const isLateCheckIn = (checkIn) => {
//   try {
//     const [wh, wm] = String(WORK_START_TIME).split(':').map(Number);
//     const [ch, cm] = String(checkIn).split(':').map(Number);
//     if (isNaN(wh) || isNaN(wm) || isNaN(ch) || isNaN(cm)) return false;
//     return ch > wh || (ch === wh && cm > wm);
//   } catch { return false; }
// };

// // Ensure a DailyAttendance doc exists; optionally update counters delta
// const bumpDaily = async (date, delta = {}) => {
//   const { start } = dayBounds(date);
//   const inc = {};
//   for (const k of ['present','late','leave','absent']) {
//     if (typeof delta[k] === 'number' && delta[k] !== 0) inc[k] = delta[k];
//   }
//   // Step 1: ensure doc exists (no $inc to avoid path conflicts on insert)
//   await DailyAttendance.updateOne(
//     { date: start },
//     { $setOnInsert: { date: start, present: 0, late: 0, leave: 0, absent: 0 } },
//     { upsert: true }
//   );
//   // Step 2: apply increments if any
//   if (Object.keys(inc).length > 0) {
//     await DailyAttendance.updateOne({ date: start }, { $inc: inc });
//   }
//   return DailyAttendance.findOne({ date: start });
// };

// // HR: list attendance for a specific date (default today)
// export const listByDate = async (req, res) => {
//   try {
//     const { date } = req.query; // yyyy-mm-dd
//     let target;
//     if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
//       const [y,m,d] = date.split('-').map(Number);
//       target = new Date(y, m-1, d, 0, 0, 0, 0); // local midnight
//     } else {
//       target = new Date();
//     }
//     const { start, end } = dayBounds(target);

//     const recs = await Attendance.find({ date: { $gte: start, $lte: end } })
//       .populate({ path: 'employee', select: 'name employeeId profileImage department', populate: { path: 'department', select: 'name' } })
//       .sort({ createdAt: -1 });
//     const data = recs.map(r => mapRecord(r));

//     // Augment with absent employees (no record for the day)
//     const allEmployees = await Employee.find({}, 'name employeeId profileImage department').populate({ path: 'department', select: 'name' });
//     const withRecord = new Set(recs.map(r => String(r.employee?._id || r.employee)));
//     const formattedDate = start.toISOString().slice(0,10);
//     for (const emp of allEmployees) {
//       const idStr = String(emp._id);
//       if (!withRecord.has(idStr)) {
//         data.push({
//           id: `absent:${idStr}:${start.getTime()}`,
//           employeeId: emp.employeeId || idStr,
//           employeeName: emp.name,
//           avatar: emp.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=3b82f6&color=fff`,
//           department: emp.department?.name || '',
//           date: formattedDate,
//           checkIn: null,
//           checkOut: null,
//           workingHours: '0h 00m',
//           status: 'absent',
//           location: null,
//         });
//       }
//     }

//     // Stats: try DailyAttendance first; if not present compute from recs and total employees
//     const present = data.filter(r => r.status === 'present').length;
//     const late = data.filter(r => r.status === 'late').length;
//     const leave = data.filter(r => r.status === 'leave').length;
//     const absent = data.filter(r => r.status === 'absent').length;
//     // Upsert daily snapshot with accurate counts
//     await DailyAttendance.updateOne(
//       { date: start },
//       { $set: { date: start, present, late, leave, absent } },
//       { upsert: true }
//     );

//     return res.status(200).json({ status: true, message: 'Attendance for date', data, stats: {
//       present,
//       late,
//       leave,
//       absent,
//       total: present + late + leave + absent
//     }});
//   } catch (err) {
//     return res.status(500).json({ status: false, message: 'Failed to fetch attendance', error: err.message });
//   }
// };

// // Self: my history (optionally limit)
// export const myHistory = async (req, res) => {
//   try {
//     const userId = req.user?._id || req.user?.id; // from authorize middleware
//     if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });
//     const { limit = 30 } = req.query;
//     const recs = await Attendance.find({ employee: userId })
//       .sort({ date: -1 })
//       .limit(Number(limit));
//     // fetch employee for mapping
//     const emp = await Employee.findById(userId).populate({ path: 'department', select: 'name' });
//     const data = recs.map(r => mapRecord(r, emp));
//     return res.status(200).json({ status: true, message: 'My attendance history', data });
//   } catch (err) {
//     return res.status(500).json({ status: false, message: 'Failed to fetch history', error: err.message });
//   }
// };

// // Mark check-in (employee)
// export const checkIn = async (req, res) => {
//   try {
//     const userId = req.user?._id || req.user?.id;
//     if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });
//     const { time, location } = req.body; // e.g. '09:15'

//     // create or upsert record for today
//     const today = new Date();
//     const { start, end } = dayBounds(today);

//     let rec = await Attendance.findOne({ employee: userId, date: { $gte: start, $lte: end } });
//     if (rec && rec.checkIn) {
//       return res.status(400).json({ status: false, message: 'Already checked in for today.' });
//     }
//     const actualTime = time || currentTime();
//     const late = isLateCheckIn(actualTime);
//     if (!rec) {
//       rec = new Attendance({ employee: userId, date: today, checkIn: actualTime, status: late ? 'late' : 'present', location: location || 'Office' });
//       await bumpDaily(today, { [late ? 'late' : 'present']: 1 });
//     } else {
//       // Only set checkIn if not already set
//       rec.checkIn = actualTime;
//       const was = rec.status;
//       if (!rec.status || rec.status === 'absent') {
//         rec.status = late ? 'late' : 'present';
//         await bumpDaily(today, { [late ? 'late' : 'present']: 1, ...(was === 'absent' ? { absent: -1 } : {}) });
//       }
//       if (location) rec.location = location;
//     }
//     await rec.save();
//     // server-side activity log: create an activity for check-in
//     try {
//       const a = new Activity({ actor: userId, action: 'Checked in', type: 'attendance', meta: { date: start.toISOString().slice(0,10), checkIn: actualTime } });
//       await a.save();
//     } catch (ae) {
//       console.error('Failed to create activity for check-in', ae);
//     }
//     const emp = await Employee.findById(userId).populate({ path: 'department', select: 'name' });
//     return res.status(200).json({ status: true, message: 'Checked in', data: mapRecord(rec, emp) });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ status: false, message: 'Failed to check in', error: err.message });
//   }
// };

// // Mark check-out (employee)
// export const checkOut = async (req, res) => {
//   try {
//     const userId = req.user?._id || req.user?.id;
//     if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });
//     const { time } = req.body; // '18:30'
//     const today = new Date();
//     const { start, end } = dayBounds(today);
//   const rec = await Attendance.findOne({ employee: userId, date: { $gte: start, $lte: end } });
//   if (!rec) return res.status(404).json({ status: false, message: 'No attendance to check out' });
//   if (!rec.checkIn) return res.status(400).json({ status: false, message: 'Cannot check out before checking in.' });
//   if (rec.checkOut) return res.status(400).json({ status: false, message: 'Already checked out for today.' });
//   rec.checkOut = time || currentTime();
//   await rec.save();
//   // server-side activity log: create an activity for check-out
//   try {
//     const a = new Activity({ actor: userId, action: 'Checked out', type: 'attendance', meta: { date: start.toISOString().slice(0,10), checkOut: rec.checkOut } });
//     await a.save();
//   } catch (ae) {
//     console.error('Failed to create activity for check-out', ae);
//   }
//   const emp = await Employee.findById(userId).populate({ path: 'department', select: 'name' });
//   return res.status(200).json({ status: true, message: 'Checked out', data: mapRecord(rec, emp) });
//   } catch (err) {
//     return res.status(500).json({ status: false, message: 'Failed to check out', error: err.message });
//   }
// };

// // HR: create or update a record for an employee/date
// export const upsert = async (req, res) => {
//   try {
//     const { employeeId, date, checkIn, checkOut, status, location } = req.body;
//     if (!employeeId || !date) return res.status(400).json({ status: false, message: 'employeeId and date required' });
//     const emp = await Employee.findById(employeeId);
//     if (!emp) return res.status(404).json({ status: false, message: 'Employee not found' });
//     const day = new Date(date);
//     const { start, end } = dayBounds(day);
//     let rec = await Attendance.findOne({ employee: emp._id, date: { $gte: start, $lte: end } });
//     if (!rec) rec = new Attendance({ employee: emp._id, date: day });
//     if (checkIn !== undefined) rec.checkIn = checkIn;
//     if (checkOut !== undefined) rec.checkOut = checkOut;
//     if (status !== undefined) rec.status = status;
//     if (location !== undefined) rec.location = location;
//     await rec.save();

//     // Update daily counters from scratch for that day (safe approach)
//     const dayRecs = await Attendance.find({ date: { $gte: start, $lte: end } });
//     const present = dayRecs.filter(r => r.status === 'present').length;
//     const late = dayRecs.filter(r => r.status === 'late').length;
//     const leave = dayRecs.filter(r => r.status === 'leave').length;
//     const totalEmployees = await Employee.countDocuments();
//     const absent = Math.max(totalEmployees - (present + late + leave), 0);
//     await DailyAttendance.updateOne(
//       { date: start },
//       { $set: { present, late, leave, absent } },
//       { upsert: true }
//     );
//     const populated = await rec.populate({ path: 'employee', select: 'name employeeId profileImage department', populate: { path: 'department', select: 'name' } });
//     return res.status(200).json({ status: true, message: 'Attendance saved', data: mapRecord(populated) });
//   } catch (err) {
//     return res.status(500).json({ status: false, message: 'Failed to upsert attendance', error: err.message });
//   }
// };

// const currentTime = () => {
//   const d = new Date();
//   const h = String(d.getHours()).padStart(2, '0');
//   const m = String(d.getMinutes()).padStart(2, '0');
//   return `${h}:${m}`;
// };

// // Stats only: both employee and HR can fetch
// export const statsByDate = async (req, res) => {
//   try {
//     const { date } = req.query; // yyyy-mm-dd
//     let target;
//     if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
//       const [y,m,d] = date.split('-').map(Number);
//       target = new Date(y, m-1, d, 0, 0, 0, 0);
//     } else {
//       target = new Date();
//     }
//     const { start, end } = dayBounds(target);
//     const recs = await Attendance.find({ date: { $gte: start, $lte: end } }).select('status');
//     const present = recs.filter(r => r.status === 'present').length;
//     const late = recs.filter(r => r.status === 'late').length;
//     const leave = recs.filter(r => r.status === 'leave').length;
//     const totalEmployees = await Employee.countDocuments();
//     const absent = Math.max(totalEmployees - (present + late + leave), 0);
//     await DailyAttendance.updateOne(
//       { date: start },
//       { $set: { date: start, present, late, leave, absent } },
//       { upsert: true }
//     );
//     return res.status(200).json({ status: true, stats: { present, late, leave, absent, total: present + late + leave + absent } });
//   } catch (err) {
//     return res.status(500).json({ status: false, message: 'Failed to fetch stats', error: err.message });
//   }
// };

import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import DailyAttendance from "../models/DailyAttendance.js";
import Activity from "../models/Activity.js";
import xlsx from "xlsx";

import csv from "csv-parser";
import fs from "fs";

// Map DB doc to frontend shape used in Attendance.jsx
const mapRecord = (rec, empDoc) => {
  const emp = empDoc || rec.employee;
  const fullName = emp?.name || "";
  const departmentName = emp?.department?.name || "";
  return {
    id: rec._id,
    employeeId: emp?.employeeId || emp?._id?.toString() || "",
    employeeName: fullName,
    avatar:
      emp?.profileImage ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff`,
    department: departmentName,
    date: new Date(rec.date).toISOString().split("T")[0],
    checkIn: rec.checkIn,
    checkOut: rec.checkOut,
    workingHours: computeWorkingHours(rec.checkIn, rec.checkOut),
    status: rec.status,
    location: rec.location,
  };
};

const computeWorkingHours = (checkIn, checkOut) => {
  if (!checkIn && !checkOut) return "0h 00m";
  if (checkIn && !checkOut) return "0h 00m"; // ongoing; frontend can special-case
  try {
    const [h1, m1] = String(checkIn).split(":").map(Number);
    const [h2, m2] = String(checkOut).split(":").map(Number);
    let mins = h2 * 60 + m2 - (h1 * 60 + m1);
    if (isNaN(mins) || mins < 0) mins = 0;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  } catch {
    return "0h 00m";
  }
};

const WORK_START_TIME = process.env.WORK_START_TIME || "09:00"; // HH:MM 24h

// normalize a date to the start/end of day
const dayBounds = (dateLike) => {
  const d = new Date(dateLike);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const isLateCheckIn = (checkIn) => {
  try {
    const [wh, wm] = String(WORK_START_TIME).split(":").map(Number);
    const [ch, cm] = String(checkIn).split(":").map(Number);
    if (isNaN(wh) || isNaN(wm) || isNaN(ch) || isNaN(cm)) return false;
    return ch > wh || (ch === wh && cm > wm);
  } catch {
    return false;
  }
};

// Ensure a DailyAttendance doc exists; optionally update counters delta
const bumpDaily = async (date, delta = {}) => {
  const { start } = dayBounds(date);
  const inc = {};
  for (const k of ["present", "late", "leave", "absent"]) {
    if (typeof delta[k] === "number" && delta[k] !== 0) inc[k] = delta[k];
  }
  // Step 1: ensure doc exists (no $inc to avoid path conflicts on insert)
  await DailyAttendance.updateOne(
    { date: start },
    { $setOnInsert: { date: start, present: 0, late: 0, leave: 0, absent: 0 } },
    { upsert: true },
  );
  // Step 2: apply increments if any
  if (Object.keys(inc).length > 0) {
    await DailyAttendance.updateOne({ date: start }, { $inc: inc });
  }
  return DailyAttendance.findOne({ date: start });
};

// HR: list attendance for a specific date (default today)
export const listByDate = async (req, res) => {
  try {
    const { date } = req.query; // yyyy-mm-dd
    let target;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split("-").map(Number);
      target = new Date(y, m - 1, d, 0, 0, 0, 0); // local midnight
    } else {
      target = new Date();
    }
    const { start, end } = dayBounds(target);

    const recs = await Attendance.find({ date: { $gte: start, $lte: end } })
      .populate({
        path: "employee",
        select: "name employeeId profileImage department",
        populate: { path: "department", select: "name" },
      })
      .sort({ createdAt: -1 });
    const data = recs.map((r) => mapRecord(r));

    // Augment with absent employees (no record for the day)
    const allEmployees = await Employee.find(
      {},
      "name employeeId profileImage department",
    ).populate({ path: "department", select: "name" });
    const withRecord = new Set(
      recs.map((r) => String(r.employee?._id || r.employee)),
    );
    const formattedDate = start.toISOString().slice(0, 10);
    for (const emp of allEmployees) {
      const idStr = String(emp._id);
      if (!withRecord.has(idStr)) {
        data.push({
          id: `absent:${idStr}:${start.getTime()}`,
          employeeId: emp.employeeId || idStr,
          employeeName: emp.name,
          avatar:
            emp.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=3b82f6&color=fff`,
          department: emp.department?.name || "",
          date: formattedDate,
          checkIn: null,
          checkOut: null,
          workingHours: "0h 00m",
          status: "absent",
          location: null,
        });
      }
    }

    // Stats: try DailyAttendance first; if not present compute from recs and total employees
    const present = data.filter((r) => r.status === "present").length;
    const late = data.filter((r) => r.status === "late").length;
    const leave = data.filter((r) => r.status === "leave").length;
    const absent = data.filter((r) => r.status === "absent").length;
    // Upsert daily snapshot with accurate counts
    await DailyAttendance.updateOne(
      { date: start },
      { $set: { date: start, present, late, leave, absent } },
      { upsert: true },
    );

    return res.status(200).json({
      status: true,
      message: "Attendance for date",
      data,
      stats: {
        present,
        late,
        leave,
        absent,
        total: present + late + leave + absent,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch attendance",
      error: err.message,
    });
  }
};

// Self: my history (optionally limit)
export const myHistory = async (req, res) => {
  try {
    const userId = req.user?._id; // JWT contains _id, not employeeId
    if (!userId)
      return res.status(401).json({ status: false, message: "Unauthorized" });
    const { limit = 30 } = req.query;
    const recs = await Attendance.find({ employee: userId })
      .sort({ date: -1 })
      .limit(Number(limit));
    // fetch employee for mapping
    const emp = await Employee.findById(userId).populate({
      path: "department",
      select: "name",
    });
    const data = recs.map((r) => mapRecord(r, emp));
    console.log("My history data", data);
    return res
      .status(200)
      .json({ status: true, message: "My attendance history", data });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch history",
      error: err.message,
    });
  }
};

export const getAttendanceByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await Attendance.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).populate("employee", "name");

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate("employee", "name") // 👈 employee ka name milega
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance ❌",
    });
  }
};

export const getAttendanceByName = async (req, res) => {
  try {
    const { name } = req.params;

    const employee = await Employee.findOne({ name });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const attendance = await Attendance.find({
      employee: employee._id,
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

function mapStatus(status) {
  if (!status) return "absent";
  const s = String(status).trim().toUpperCase();
  if (s === "P") return "present";
  if (s === "A") return "absent";
  if (s === "HD") return "halfday";
  if (s === "LH") return "leave";
  return "present";
}

export const uploadAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please upload a CSV or Excel file.",
      });
    }

    const employeeId = req.body.employeeId;

    if (!employeeId) {
      if (req.file?.path && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message:
          "Employee ID is required. Please select an employee from dropdown.",
      });
    }

    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      if (req.file?.path && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Selected employee not found.",
      });
    }

    const results = [];
    let processed = 0;
    let skipped = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        try {
          for (const row of results) {
            // ================== DATE PARSING ==================
            const dateStr = row["Date"]?.trim() || row["date"]?.trim();

            if (!dateStr) {
              skipped++;
              continue;
            }

            let attendanceDate = null;

            // Support DD-MM-YYYY or DD/MM/YYYY (Indian format)
            if (dateStr.includes("-") || dateStr.includes("/")) {
              const separator = dateStr.includes("-") ? "-" : "/";
              const parts = dateStr.split(separator);

              if (parts.length === 3) {
                let day, month, year;

                if (parts[0].length === 4) {
                  // YYYY-MM-DD
                  year = parseInt(parts[0], 10);
                  month = parseInt(parts[1], 10) - 1;
                  day = parseInt(parts[2], 10);
                } else {
                  // DD-MM-YYYY
                  day = parseInt(parts[0], 10);
                  month = parseInt(parts[1], 10) - 1;
                  year = parseInt(parts[2], 10);
                }

                attendanceDate = new Date(year, month, day);
                attendanceDate.setHours(0, 0, 0, 0);
              }
            } else {
              // Fallback
              attendanceDate = new Date(dateStr);
              if (!isNaN(attendanceDate.getTime())) {
                attendanceDate.setHours(0, 0, 0, 0);
              }
            }

            if (!attendanceDate || isNaN(attendanceDate.getTime())) {
              console.log(`Invalid date skipped: ${dateStr}`);
              skipped++;
              continue;
            }

            // Extract data from file (ignore Name & EmpID)
            const checkIn =
              row["CheckIn"]?.trim() ||
              row["Check In"]?.trim() ||
              row["checkin"]?.trim() ||
              null;
            const checkOut =
              row["CheckOut"]?.trim() ||
              row["Check Out"]?.trim() ||
              row["checkout"]?.trim() ||
              null;
            const totalHours =
              row["TotalHours"]?.trim() ||
              row["Total Hours"]?.trim() ||
              row["totalhours"]?.trim() ||
              row["hours"]?.trim() ||
              null;

            let status = (row["Status"]?.trim() || "P").toUpperCase();

            const statusMap = {
              PRESENT: "P",
              ABSENT: "A",
              HOLIDAY: "H",
              WEEKOFF: "W",
              HALFDAY: "HD",
              LATE: "LH",
              CL: "CL",
              HCL: "HCL",
            };

            status = statusMap[status] || status;

            const validStatuses = [
              "P",
              "A",
              "H",
              "W",
              "LH",
              "HD",
              "PW",
              "PH",
              "PHW",
              "XX",
              "CL",
              "HCL",
            ];
            if (!validStatuses.includes(status)) {
              status = "P"; // default to Present
            }

            // Save or Update Attendance
            await Attendance.findOneAndUpdate(
              {
                employee: employee._id,
                date: attendanceDate,
              },
              {
                employee: employee._id,
                date: attendanceDate,
                checkIn,
                checkOut,
                totalHours,
                status,
                notes: row["Notes"]?.trim() || row["notes"]?.trim() || "",
                location:
                  row["Location"]?.trim() ||
                  row["location"]?.trim() ||
                  "Bhopal",
                // month and year will be auto-filled by pre-save hook in schema
              },
              { upsert: true, new: true, runValidators: true },
            );

            processed++;
          }

          // Cleanup file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          return res.status(200).json({
            success: true,
            message: `Attendance uploaded successfully for ${employee.name}`,
            totalRecords: results.length,
            processed,
            skipped,
            employee: employee.name,
          });
        } catch (err) {
          console.error("Processing Error:", err);
          if (req.file?.path && fs.existsSync(req.file.path))
            fs.unlinkSync(req.file.path);
          return res.status(500).json({
            success: false,
            message: "Error processing attendance records",
          });
        }
      })
      .on("error", (err) => {
        console.error("CSV Parsing Error:", err);
        if (req.file?.path && fs.existsSync(req.file.path))
          fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Error reading the uploaded CSV file",
        });
      });
  } catch (error) {
    console.error("Server Error:", error);
    if (req.file?.path && fs.existsSync(req.file.path))
      fs.unlinkSync(req.file.path);
    return res.status(500).json({
      success: false,
      message: "Internal server error during upload",
    });
  }
};
// export const uploadAttendance = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded. Please upload a CSV or Excel file.",
//       });
//     }

//     const results = [];
//     let processed = 0;
//     let skipped = 0;

//     fs.createReadStream(req.file.path)
//       .pipe(csv())
//       .on("data", (row) => results.push(row))
//       .on("end", async () => {
//         try {
//           for (const row of results) {
//             const name = row["Name"]?.trim();
//             const empId = row["EmpID"]?.trim() || row["EmployeeID"]?.trim() || row["empid"]?.trim();

//             if (!name && !empId) {
//               skipped++;
//               continue;
//             }

//             // Find existing employee or create new
//             let employee = await Employee.findOne({
//               $or: [
//                 { employeeId: empId },
//                 { name: { $regex: new RegExp(`^${name}$`, "i") } },
//               ],
//             });

//             if (!employee) {
//               employee = await Employee.create({
//                 name: name || `Employee ${empId}`,
//                 employeeId: empId || null,
//                 email: empId
//                   ? `${empId.toLowerCase()}@company.com`
//                   : `${name?.toLowerCase().replace(/\s+/g, "")}@company.com`,
//                 status: "active",
//               });
//             }

//             // ================== DATE PARSING (Improved) ==================
//             const dateStr = row["Date"]?.trim() || row["date"]?.trim();

//             if (!dateStr) {
//               skipped++;
//               continue;
//             }

//             let attendanceDate = null;

//             // Handle DD-MM-YYYY (most common in Indian sheets)
//             if (dateStr.includes("-") || dateStr.includes("/")) {
//               const parts = dateStr.split(/[-\/]/);
//               if (parts.length === 3) {
//                 let day, month, year;

//                 // Check if format is DD-MM-YYYY or MM-DD-YYYY or YYYY-MM-DD
//                 if (parts[0].length === 4) { // YYYY-MM-DD
//                   year = parseInt(parts[0], 10);
//                   month = parseInt(parts[1], 10) - 1;
//                   day = parseInt(parts[2], 10);
//                 } else { // DD-MM-YYYY (Indian format)
//                   day = parseInt(parts[0], 10);
//                   month = parseInt(parts[1], 10) - 1;
//                   year = parseInt(parts[2], 10);
//                 }

//                 attendanceDate = new Date(year, month, day);
//                 attendanceDate.setHours(0, 0, 0, 0);
//               }
//             }
//             // Fallback
//             else {
//               attendanceDate = new Date(dateStr);
//               if (!isNaN(attendanceDate.getTime())) {
//                 attendanceDate.setHours(0, 0, 0, 0);
//               }
//             }

//             if (!attendanceDate || isNaN(attendanceDate.getTime())) {
//               console.log(`Invalid date skipped: ${dateStr} for ${name || empId}`);
//               skipped++;
//               continue;
//             }

//             // Extract other fields (flexible column names)
//             const checkIn = row["CheckIn"]?.trim() || row["Check In"]?.trim() || row["checkin"]?.trim() || null;
//             const checkOut = row["CheckOut"]?.trim() || row["Check Out"]?.trim() || row["checkout"]?.trim() || null;
//             const totalHours = row["TotalHours"]?.trim() || row["Total Hours"]?.trim() || row["totalhours"]?.trim() || row["hours"]?.trim() || null;

//             let status = (row["Status"]?.trim() || "P").toUpperCase();

//             // Map common status values to your enum
//             const statusMap = {
//               'PRESENT': 'P',
//               'ABSENT': 'A',
//               'HOLIDAY': 'H',
//               'WEEKOFF': 'W',
//               'HALFDAY': 'HD',
//               'LATE': 'LH',
//               'CL': 'CL',
//               'HCL': 'HCL'
//             };

//             status = statusMap[status] || status;

//             // Final validation of status
//             const validStatuses = ['P','A','H','W','LH','HD','PW','PH','PHW','XX','CL','HCL'];
//             if (!validStatuses.includes(status)) {
//               status = 'P'; // default to Present if invalid
//             }

//             // Save or Update Attendance
//             await Attendance.findOneAndUpdate(
//               {
//                 employee: employee._id,
//                 date: attendanceDate,
//               },
//               {
//                 employee: employee._id,
//                 date: attendanceDate,
//                 checkIn,
//                 checkOut,
//                 totalHours,
//                 status,
//                 notes: row["Notes"]?.trim() || row["notes"]?.trim() || "",
//                 location: row["Location"]?.trim() || row["location"]?.trim() || "Bhopal",
//               },
//               { upsert: true, new: true, runValidators: true }
//             );

//             processed++;
//           }

//           // Cleanup uploaded file
//           if (fs.existsSync(req.file.path)) {
//             fs.unlinkSync(req.file.path);
//           }

//           return res.status(200).json({
//             success: true,
//             message: "Attendance uploaded successfully!",
//             totalRecords: results.length,
//             processed,
//             skipped,
//           });
//         } catch (err) {
//           console.error("Processing Error:", err);
//           if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
//           return res.status(500).json({
//             success: false,
//             message: "Error while processing attendance records",
//           });
//         }
//       })
//       .on("error", (err) => {
//         console.error("CSV Parsing Error:", err);
//         if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
//         return res.status(400).json({
//           success: false,
//           message: "Error reading the uploaded file",
//         });
//       });
//   } catch (error) {
//     console.error("Server Error:", error);
//     if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error during upload",
//     });
//   }
// };

// export const uploadAttendance = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded. Please upload a CSV/Excel file.",
//       });
//     }

//     const results = [];
//     let processed = 0;
//     let skipped = 0;

//     fs.createReadStream(req.file.path)
//       .pipe(csv())
//       .on("data", (row) => results.push(row))
//       .on("end", async () => {
//         try {
//           for (const row of results) {
//             const name = row["Name"]?.trim();
//             const empId = row["EmpID"]?.trim() || row["EmployeeID"]?.trim();

//             if (!name) {
//               skipped++;
//               continue;
//             }

//             // Find or Create Employee
//             let employee = await Employee.findOne({
//               $or: [
//                 { employeeId: empId },
//                 { name: { $regex: new RegExp(`^${name}$`, "i") } },
//               ],
//             });

//             if (!employee) {
//               employee = await Employee.create({
//                 name,
//                 employeeId: empId || null,
//                 email: empId
//                   ? `${empId.toLowerCase()}@temp.com`
//                   : `${name.toLowerCase().replace(/\s+/g, "")}@temp.com`,
//                 status: "active",
//               });
//             }

//             // ================== CRITICAL: DATE PARSING (Same Date as CSV) ==================
//             const dateStr = row["Date"]?.trim();

//             if (!dateStr) {
//               skipped++;
//               continue;
//             }

//             let attendanceDate;

//             // Handle DD-MM-YYYY (most common in Indian attendance sheets)
//             if (dateStr.includes("-")) {
//               const parts = dateStr.split("-");
//               if (parts.length === 3) {
//                 // DD-MM-YYYY → Convert safely without timezone issue
//                 const day = parseInt(parts[0], 10);
//                 const month = parseInt(parts[1], 10) - 1; // 0-based
//                 const year = parseInt(parts[2], 10);

//                 attendanceDate = new Date(year, month, day);
//                 attendanceDate.setHours(0, 0, 0, 0); // Remove time part
//               }
//             }
//             // Handle YYYY-MM-DD
//             else if (
//               dateStr.includes("-") &&
//               dateStr.split("-")[0].length === 4
//             ) {
//               attendanceDate = new Date(dateStr);
//               attendanceDate.setHours(0, 0, 0, 0);
//             }
//             // Handle other formats
//             else {
//               attendanceDate = new Date(dateStr);
//               if (!isNaN(attendanceDate.getTime())) {
//                 attendanceDate.setHours(0, 0, 0, 0);
//               }
//             }

//             if (isNaN(attendanceDate?.getTime())) {
//               console.log(`Invalid date skipped: ${dateStr} for ${name}`);
//               skipped++;
//               continue;
//             }

//             // Extract other fields
//             const checkIn =
//               row["CheckIn"]?.trim() || row["Check In"]?.trim() || null;
//             const checkOut =
//               row["CheckOut"]?.trim() || row["Check Out"]?.trim() || null;
//             const totalHours =
//               row["totalHours"]?.trim() ||
//               row["TotalHours"]?.trim() ||
//               row["Hours"]?.trim() ||
//               null;

//             let status = (row["Status"]?.trim() || "present").toLowerCase();
//             const statusMap = {
//               w: "W",
//               a: "A",
//               h: "H",
//               hd: "HD",
//               cl: "CL",
//               hcl: "HCL",
//               present: "present",
//               absent: "absent",
//               late: "late",
//               leave: "leave",
//             };
//             status = statusMap[status] || status;

//             const monthName = attendanceDate.toLocaleString("default", {
//               month: "long",
//             });
//             const year = attendanceDate.getFullYear();

//             // Save / Update with exact date (00:00:00)
//             await Attendance.findOneAndUpdate(
//               {
//                 employee: employee._id,
//                 date: attendanceDate, // Exact date match
//               },
//               {
//                 employee: employee._id,
//                 date: attendanceDate,
//                 checkIn,
//                 checkOut,
//                 totalHours,
//                 status,
//                 month: `${monthName}-${year}`,
//                 year: year,
//                 notes: row["Notes"]?.trim() || "",
//                 location: row["Location"]?.trim() || null,
//               },
//               { upsert: true, new: true, runValidators: true },
//             );

//             processed++;
//           }

//           // Cleanup uploaded file
//           if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

//           return res.status(200).json({
//             success: true,
//             message: "Attendance uploaded successfully ✅",
//             totalRecords: results.length,
//             processed,
//             skipped,
//           });
//         } catch (err) {
//           console.error("Processing Error:", err);
//           if (req.file?.path && fs.existsSync(req.file.path))
//             fs.unlinkSync(req.file.path);
//           return res.status(500).json({
//             success: false,
//             message: "Error processing file",
//           });
//         }
//       })
//       .on("error", (err) => {
//         console.error("CSV Error:", err);
//         if (req.file?.path && fs.existsSync(req.file.path))
//           fs.unlinkSync(req.file.path);
//         return res.status(400).json({
//           success: false,
//           message: "Error reading CSV file",
//         });
//       });
//   } catch (error) {
//     console.error("Server Error:", error);
//     if (req.file?.path && fs.existsSync(req.file.path))
//       fs.unlinkSync(req.file.path);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

export const getAttendanceByDatequery = async (req, res) => {
  try {
    const { employeeId, date } = req.query;

    const filter = {};

    if (employeeId) {
      filter.employee = employeeId;
    }

    if (date) {
      // Convert to start and end of day to avoid timezone issues
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const attendance = await Attendance.find(filter)
      .populate("employee", "name employeeId") // Get employee name
      .sort({ date: -1 }); // Latest first

    res.status(200).json({
      success: true,
      message: "Attendance fetched successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Get Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance",
      error: error.message,
    });
  }
};

// export const uploadAttendance = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded. Please upload a CSV/Excel file.",
//       });
//     }

//     const results = [];
//     let processed = 0;
//     let skipped = 0;

//     fs.createReadStream(req.file.path)
//       .pipe(csv())
//       .on("data", (row) => {
//         results.push(row);
//       })
//       .on("end", async () => {
//         try {
//           for (const row of results) {
//             const name = row["Name"]?.trim();
//             const empId = row["EmpID"]?.trim() || row["EmployeeID"]?.trim() || row["ID"]?.trim();

//             // Skip if no name
//             if (!name) {
//               skipped++;
//               continue;
//             }

//             // Find or Create Employee
//             let employee = await Employee.findOne({
//               $or: [
//                 { employeeId: empId },
//                 { name: { $regex: new RegExp(`^${name}$`, "i") } }
//               ]
//             });

//             if (!employee) {
//               employee = await Employee.create({
//                 name: name,
//                 employeeId: empId || null,
//                 email: empId
//                   ? `${empId.toLowerCase()}@temp.com`
//                   : `${name.toLowerCase().replace(/\s+/g, "")}@temp.com`,
//                 status: "active",
//               });
//             }

//             // ================== DATE FROM CSV FILE ==================
//             const dateStr = row["Date"]?.trim() || row["date"]?.trim();

//             if (!dateStr) {
//               skipped++;
//               console.log(`Skipped row - No date found for: ${name}`);
//               continue;
//             }

//             let attendanceDate;

//             // Handle different date formats from CSV
//             if (dateStr.includes("-")) {
//               const parts = dateStr.split("-");
//               if (parts.length === 3) {
//                 // If format is DD-MM-YYYY
//                 if (parts[0].length <= 2) {
//                   attendanceDate = new Date(parts[2], parts[1] - 1, parts[0]);
//                 }
//                 // If format is YYYY-MM-DD
//                 else {
//                   attendanceDate = new Date(dateStr);
//                 }
//               }
//             }
//             else if (dateStr.includes("/")) {
//               // Handle MM/DD/YYYY or DD/MM/YYYY
//               const parts = dateStr.split("/");
//               if (parts.length === 3) {
//                 attendanceDate = new Date(parts[2], parts[0] - 1, parts[1]); // Assume MM/DD/YYYY (common in many systems)
//               }
//             }
//             else {
//               attendanceDate = new Date(dateStr);
//             }

//             if (isNaN(attendanceDate.getTime())) {
//               console.log(`Invalid date skipped: ${dateStr} for ${name}`);
//               skipped++;
//               continue;
//             }

//             // Extract data from CSV
//             const checkIn = row["CheckIn"]?.trim() || row["Check In"]?.trim() || null;
//             const checkOut = row["CheckOut"]?.trim() || row["Check Out"]?.trim() || null;
//             const totalHours = row["totalHours"]?.trim() ||
//                               row["TotalHours"]?.trim() ||
//                               row["Hours"]?.trim() || null;

//             // Status handling
//             let status = (row["Status"]?.trim() || "present").toLowerCase();

//             const statusMap = {
//               'w': 'W', 'a': 'A', 'h': 'H', 'hd': 'HD', 'cl': 'CL', 'hcl': 'HCL',
//               'present': 'present', 'absent': 'absent', 'late': 'late', 'leave': 'leave'
//             };
//             status = statusMap[status] || status;

//             // Month & Year for reporting
//             const monthName = attendanceDate.toLocaleString("default", { month: "long" });
//             const year = attendanceDate.getFullYear();

//             // Save or Update Attendance
//             await Attendance.findOneAndUpdate(
//               {
//                 employee: employee._id,
//                 date: attendanceDate,
//               },
//               {
//                 employee: employee._id,
//                 date: attendanceDate,
//                 checkIn,
//                 checkOut,
//                 totalHours,
//                 status,
//                 month: `${monthName}-${year}`,
//                 year: year,
//                 notes: row["Notes"]?.trim() || "",
//                 location: row["Location"]?.trim() || null,
//               },
//               {
//                 upsert: true,
//                 new: true,
//                 runValidators: true,
//               }
//             );

//             processed++;
//           }

//           // Delete uploaded file after processing
//           if (fs.existsSync(req.file.path)) {
//             fs.unlinkSync(req.file.path);
//           }

//           return res.status(200).json({
//             success: true,
//             message: "Attendance uploaded successfully ✅",
//             totalRecords: results.length,
//             processed,
//             skipped,
//           });

//         } catch (processingError) {
//           console.error("Processing Error:", processingError);
//           if (req.file?.path && fs.existsSync(req.file.path)) {
//             fs.unlinkSync(req.file.path);
//           }
//           return res.status(500).json({
//             success: false,
//             message: "Error processing attendance file",
//           });
//         }
//       })
//       .on("error", (error) => {
//         console.error("CSV Parsing Error:", error);
//         if (req.file?.path && fs.existsSync(req.file.path)) {
//           fs.unlinkSync(req.file.path);
//         }
//         return res.status(400).json({
//           success: false,
//           message: "Error parsing CSV file. Please check file format.",
//         });
//       });

//   } catch (error) {
//     console.error("Server Error:", error);
//     if (req.file?.path && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }
//     return res.status(500).json({
//       success: false,
//       message: "Server error during upload",
//     });
//   }
// };

// export const uploadAttendance = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded. Please upload a CSV file.",
//       });
//     }

//     const results = [];

//     fs.createReadStream(req.file.path)
//       .pipe(csv())
//       .on("data", (row) => {
//         results.push(row);
//       })
//       .on("end", async () => {
//         let processed = 0;
//         let skipped = 0;

//         try {
//           for (const row of results) {
//             const name = row["Name"]?.trim();
//             const empId = row["EmpID"]?.trim() || row["EmployeeID"]?.trim();

//             if (!name) {
//               skipped++;
//               continue;
//             }

//             // Find or Create Employee
//             let employee = await Employee.findOne({
//               $or: [
//                 { employeeId: empId },
//                 { name: { $regex: new RegExp(`^${name}$`, 'i') } }
//               ]
//             });

//             if (!employee) {
//               employee = await Employee.create({
//                 name: name,
//                 employeeId: empId || null,
//                 email: empId ? `${empId.toLowerCase()}@temp.com` : `${name.toLowerCase().replace(/\s+/g, '')}@temp.com`,
//                 status: "active",
//               });
//             }

//             // Parse Date (supports DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD)
//             let date;
//             const dateStr = row["Date"]?.trim();

//             if (!dateStr) {
//               skipped++;
//               continue;
//             }

//             if (dateStr.includes("-")) {
//               const parts = dateStr.split("-");
//               if (parts.length === 3) {
//                 // If first part is year → YYYY-MM-DD, else assume DD-MM-YYYY
//                 if (parts[0].length === 4) {
//                   date = new Date(dateStr);
//                 } else {
//                   date = new Date(parts[2], parts[1] - 1, parts[0]); // DD-MM-YYYY
//                 }
//               }
//             } else {
//               date = new Date(dateStr);
//             }

//             if (isNaN(date.getTime())) {
//               console.log(`Invalid date skipped: ${dateStr}`);
//               skipped++;
//               continue;
//             }

//             // Extract CheckIn, CheckOut, TotalHours from CSV
//             const checkIn = row["CheckIn"]?.trim() || row["Check In"]?.trim() || null;
//             const checkOut = row["CheckOut"]?.trim() || row["Check Out"]?.trim() || null;
//             const totalHours = row["totalHours"]?.trim() || row["TotalHours"]?.trim() || row["Hours"]?.trim() || null;

//             // Determine Status
//             let status = row["Status"]?.trim()?.toLowerCase() || "present";

//             // Normalize common status codes from your legend
//             const statusMap = {
//               'w': 'W', 'a': 'A', 'h': 'H', 'hd': 'HD', 'cl': 'CL', 'hcl': 'HCL',
//               'present': 'present', 'absent': 'absent', 'late': 'late', 'leave': 'leave'
//             };
//             status = statusMap[status] || status;

//             // Month & Year
//             const month = date.toLocaleString("default", { month: "long" });
//             const year = date.getFullYear();

//             // Save or Update Attendance Record
//             await Attendance.findOneAndUpdate(
//               {
//                 employee: employee._id,
//                 date: date,
//               },
//               {
//                 employee: employee._id,
//                 date: date,
//                 checkIn,
//                 checkOut,
//                 totalHours,
//                 status,
//                 month: `${month}-${year}`,
//                 year: year,
//                 notes: row["Notes"]?.trim() || "",
//                 location: row["Location"]?.trim() || null,
//               },
//               {
//                 upsert: true,
//                 new: true,
//                 runValidators: true,
//               }
//             );

//             processed++;
//           }

//           // Delete temporary uploaded file
//           fs.unlinkSync(req.file.path);

//           return res.status(200).json({
//             success: true,
//             message: "Attendance uploaded successfully ✅",
//             totalRecords: results.length,
//             processed,
//             skipped,
//           });

//         } catch (processingError) {
//           console.error("Processing Error:", processingError);
//           if (req.file?.path) fs.unlinkSync(req.file.path); // cleanup
//           return res.status(500).json({
//             success: false,
//             message: "Error while processing attendance data",
//             error: processingError.message,
//           });
//         }
//       })
//       .on("error", (error) => {
//         console.error("CSV Parsing Error:", error);
//         if (req.file?.path) fs.unlinkSync(req.file.path);
//         return res.status(400).json({
//           success: false,
//           message: "Error parsing CSV file",
//         });
//       });

//   } catch (error) {
//     console.error("Server Error:", error);
//     if (req.file?.path) fs.unlinkSync(req.file.path);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while uploading attendance",
//     });
//   }
// };
// export const uploadAttendance = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         message: "File not uploaded ❌",
//       });
//     }

//     const results = [];

//     fs.createReadStream(req.file.path)
//       .pipe(csv())
//       .on("data", (data) => results.push(data))
//       .on("end", async () => {
//         try {
//           for (const row of results) {
//             const name = row["Name"]?.trim();

//             if (!name) continue;

//             // ✅ employee same name
//             let employee = await Employee.findOne({ name });

//             if (!employee) {
//               employee = await Employee.create({ name });
//             }

//             const date = new Date(row["Date"]);

//             // ❗ invalid date skip
//             if (isNaN(date)) continue;

//             // ✅ attendance save/update
//             await Attendance.findOneAndUpdate(
//               {
//                 employee: employee._id,
//                 date: date,
//               },
//               {
//                 employee: employee._id,
//                 date: date,
//                 checkIn: row["Check In"] || null,
//                 checkOut: row["Check Out"] || null,
//                 status: row["Status"]
//                   ? row["Status"].toLowerCase()
//                   : "present",
//                 location: row["Location"] || null,
//                 notes: row["Notes"] || "",
//               },
//               {
//                 upsert: true,
//                 new: true,
//               }
//             );
//           }

//           // ✅ file delete after process (important)
//           fs.unlinkSync(req.file.path);

//           res.status(200).json({
//             message: "CSV uploaded successfully ✅",
//           });
//         } catch (err) {
//           console.log(err);
//           res.status(500).json({
//             message: "Processing error ❌",
//           });
//         }
//       });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       message: "Server error ❌",
//     });
//   }
// };

// Mark check-in (employee)
export const checkIn = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId)
      return res.status(401).json({ status: false, message: "Unauthorized" });
    const { time, location } = req.body; // e.g. '09:15'

    // create or upsert record for today
    const today = new Date();
    const { start, end } = dayBounds(today);

    let rec = await Attendance.findOne({
      employee: userId,
      date: { $gte: start, $lte: end },
    });
    if (rec && rec.checkIn) {
      return res
        .status(400)
        .json({ status: false, message: "Already checked in for today." });
    }
    const actualTime = time || currentTime();
    const late = isLateCheckIn(actualTime);
    if (!rec) {
      rec = new Attendance({
        employee: userId,
        date: today,
        checkIn: actualTime,
        status: late ? "late" : "present",
        location: location || "Office",
      });
      await bumpDaily(today, { [late ? "late" : "present"]: 1 });
    } else {
      // Only set checkIn if not already set
      rec.checkIn = actualTime;
      const was = rec.status;
      if (!rec.status || rec.status === "absent") {
        rec.status = late ? "late" : "present";
        await bumpDaily(today, {
          [late ? "late" : "present"]: 1,
          ...(was === "absent" ? { absent: -1 } : {}),
        });
      }
      if (location) rec.location = location;
    }
    await rec.save();
    // server-side activity log: create an activity for check-in
    try {
      const a = new Activity({
        actor: userId,
        action: "Checked in",
        type: "attendance",
        meta: { date: start.toISOString().slice(0, 10), checkIn: actualTime },
      });
      await a.save();
    } catch (ae) {
      console.error("Failed to create activity for check-in", ae);
    }
    const emp = await Employee.findById(userId).populate({
      path: "department",
      select: "name",
    });
    return res
      .status(200)
      .json({ status: true, message: "Checked in", data: mapRecord(rec, emp) });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: false,
      message: "Failed to check in",
      error: err.message,
    });
  }
};

// Mark check-out (employee)
export const checkOut = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId)
      return res.status(401).json({ status: false, message: "Unauthorized" });
    const { time } = req.body; // '18:30'
    const today = new Date();
    const { start, end } = dayBounds(today);
    const rec = await Attendance.findOne({
      employee: userId,
      date: { $gte: start, $lte: end },
    });
    if (!rec)
      return res
        .status(404)
        .json({ status: false, message: "No attendance to check out" });
    if (!rec.checkIn)
      return res.status(400).json({
        status: false,
        message: "Cannot check out before checking in.",
      });
    if (rec.checkOut)
      return res
        .status(400)
        .json({ status: false, message: "Already checked out for today." });
    rec.checkOut = time || currentTime();
    await rec.save();
    // server-side activity log: create an activity for check-out
    try {
      const a = new Activity({
        actor: userId,
        action: "Checked out",
        type: "attendance",
        meta: {
          date: start.toISOString().slice(0, 10),
          checkOut: rec.checkOut,
        },
      });
      await a.save();
    } catch (ae) {
      console.error("Failed to create activity for check-out", ae);
    }
    const emp = await Employee.findById(userId).populate({
      path: "department",
      select: "name",
    });
    return res.status(200).json({
      status: true,
      message: "Checked out",
      data: mapRecord(rec, emp),
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to check out",
      error: err.message,
    });
  }
};

// HR: create or update a record for an employee/date
export const upsert = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, location } = req.body;
    if (!employeeId || !date)
      return res
        .status(400)
        .json({ status: false, message: "employeeId and date required" });
    const emp = await Employee.findById(employeeId);
    if (!emp)
      return res
        .status(404)
        .json({ status: false, message: "Employee not found" });
    const day = new Date(date);
    const { start, end } = dayBounds(day);
    let rec = await Attendance.findOne({
      employee: emp._id,
      date: { $gte: start, $lte: end },
    });
    if (!rec) rec = new Attendance({ employee: emp._id, date: day });
    if (checkIn !== undefined) rec.checkIn = checkIn;
    if (checkOut !== undefined) rec.checkOut = checkOut;
    if (status !== undefined) rec.status = status;
    if (location !== undefined) rec.location = location;
    await rec.save();

    // Update daily counters from scratch for that day (safe approach)
    const dayRecs = await Attendance.find({ date: { $gte: start, $lte: end } });
    const present = dayRecs.filter((r) => r.status === "present").length;
    const late = dayRecs.filter((r) => r.status === "late").length;
    const leave = dayRecs.filter((r) => r.status === "leave").length;
    const totalEmployees = await Employee.countDocuments();
    const absent = Math.max(totalEmployees - (present + late + leave), 0);
    await DailyAttendance.updateOne(
      { date: start },
      { $set: { present, late, leave, absent } },
      { upsert: true },
    );
    const populated = await rec.populate({
      path: "employee",
      select: "name employeeId profileImage department",
      populate: { path: "department", select: "name" },
    });
    return res.status(200).json({
      status: true,
      message: "Attendance saved",
      data: mapRecord(populated),
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to upsert attendance",
      error: err.message,
    });
  }
};

const currentTime = () => {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

// Stats only: both employee and HR can fetch
export const statsByDate = async (req, res) => {
  try {
    const { date } = req.query; // yyyy-mm-dd
    let target;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split("-").map(Number);
      target = new Date(y, m - 1, d, 0, 0, 0, 0);
    } else {
      target = new Date();
    }
    const { start, end } = dayBounds(target);
    const recs = await Attendance.find({
      date: { $gte: start, $lte: end },
    }).select("status");
    const present = recs.filter((r) => r.status === "present").length;
    const late = recs.filter((r) => r.status === "late").length;
    const leave = recs.filter((r) => r.status === "leave").length;
    const totalEmployees = await Employee.countDocuments();
    const absent = Math.max(totalEmployees - (present + late + leave), 0);
    await DailyAttendance.updateOne(
      { date: start },
      { $set: { date: start, present, late, leave, absent } },
      { upsert: true },
    );
    return res.status(200).json({
      status: true,
      stats: {
        present,
        late,
        leave,
        absent,
        total: present + late + leave + absent,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch stats",
      error: err.message,
    });
  }
};
