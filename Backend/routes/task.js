import express from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from "../controllers/taskController.js";
import authorize from "../middlewares/authorize.js";

const router = express.Router();

// Routes
router.get("/", authorize(["employee", "hr"]), getAllTasks);
router.get("/:id", authorize(["employee", "hr"]), getTaskById);
router.post("/", authorize(["employee", "hr"]), createTask);
router.patch("/:id", authorize(["employee", "hr"]), updateTask);
router.delete("/:id", authorize(["hr"]), deleteTask);
router.patch("/:id/status", authorize(["hr"]), updateTaskStatus);

export default router;
