import express from "express";
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  editEmployee,
  deleteEmployee,
  grantLeave,
} from "../controllers/employeeController.js";
import authorize from "../middlewares/authorize.js";
import upload from "../config/multer.js";
import uploadProfile from "../config/multerProfile.js";
import {
  resumeUpload,
  profileUpload,
} from "../controllers/employeeController.js";

const router = express.Router();

const profileUploadMiddleware = (req, res, next) => {
  uploadProfile.single("profile")(req, res, (error) => {
    if (!error) return next();

    console.error("Profile upload middleware error:", error);
    return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 500).json({
      status: false,
      message: error.message || "Profile image upload failed",
      error: error.http_code || error.code || undefined,
    });
  });
};

router.get("/", authorize(["employee", "hr"]), getAllEmployees);
router.get("/:id", authorize(["employee", "hr"]), getEmployeeById);
router.post("/create", authorize(["hr"]), createEmployee);
router.put("/update/:id", authorize(["employee", "hr"]), updateEmployee);
router.put("/edit/:id", authorize(["employee", "hr"]), editEmployee);
router.delete("/delete/:id", authorize(["hr"]), deleteEmployee);
router.put("/upload-resume/:id", upload.single("resume"), resumeUpload);
router.put(
  "/upload-profile/:id",
  authorize(["employee", "hr"]),
  profileUploadMiddleware,
  profileUpload,
);
router.post("/:id/grant-leave", authorize(["hr"]), grantLeave);

export default router;
