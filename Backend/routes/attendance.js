// import express from 'express';
// import authorize from '../middlewares/authorize.js';
// import { listByDate, myHistory, checkIn, checkOut, upsert, statsByDate } from '../controllers/attendanceController.js';

// const router = express.Router();

// // HR: list for date
// router.get('/', authorize(['hr']), listByDate);

// // Self: my history
// router.get('/me', authorize(['employee', 'hr']), myHistory);

// // Stats by date
// router.get('/stats', authorize(['employee', 'hr']), statsByDate);

// // Employee actions
// router.post('/check-in', authorize(['employee', 'hr']), checkIn);
// router.post('/check-out', authorize(['employee', 'hr']), checkOut);

// // HR upsert
// router.post('/upsert', authorize(['hr']), upsert);

// export default router;


import express from "express";
import authorize from "../middlewares/authorize.js";
import {
  listByDate,
  myHistory,
  checkIn,
  checkOut,
  upsert,
  statsByDate,
  uploadAttendance,
  getAttendanceByName,
  getAttendanceByDate,
  getAllAttendance,
  getAttendanceByDatequery,
} from "../controllers/attendanceController.js";
import upload from "../middlewares/multer.js";
const router = express.Router();

// HR: list for date
router.get("/", authorize(["hr"]), listByDate);

// Self: my history
router.get("/me", authorize(["employee", "hr"]), myHistory);

// Stats by date
router.get("/stats", authorize(["employee", "hr"]), statsByDate);

// Employee actions
router.post("/check-in", authorize(["employee", "hr"]), checkIn);
router.post("/check-out", authorize(["employee", "hr"]), checkOut);

// HR upsert
router.post("/upsert", authorize(["hr"]), upsert);

router.post(
  "/upload-attendance",
  upload.single("file"),
  authorize(["hr"]),
  uploadAttendance,
);
router.get(
  "/employee/:name",
  authorize(["employee", "hr"]),
  getAttendanceByName,
);
router.get("/date", authorize(["employee", "hr"]), getAllAttendance);

router.get(
  "/datefilter",
  authorize(["hr"]),
  getAttendanceByDatequery,
);

export default router;
