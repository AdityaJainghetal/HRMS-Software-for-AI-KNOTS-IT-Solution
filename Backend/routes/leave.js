import express from "express";
import authorize from "../middlewares/authorize.js";
import {
  createLeave,
  listLeaves,
  reviewLeave,
  updateLeave,
  deleteLeave,
  getLeaveBalance,
  uploadMedicalDocument,
} from "../controllers/leaveController.js";
import uploadLeaveDocument from "../config/multerLeave.js";

const router = express.Router();
const handleMedicalDocumentUpload = (req, res, next) => {
  uploadLeaveDocument.single("medicalDocument")(req, res, (error) => {
    if (error) {
      return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
        status: false,
        message: error.message || "Medical document upload failed.",
      });
    }
    next();
  });
};

// Employee: create leave
router.post(
  "/",
  authorize(["employee", "hr"]),
  handleMedicalDocumentUpload,
  createLeave,
);
router.get("/balance", authorize(["employee", "hr"]), getLeaveBalance);
router.post(
  "/:id/medical-document",
  authorize(["employee"]),
  handleMedicalDocumentUpload,
  uploadMedicalDocument,
);
// List: HR gets all, employee gets own
router.get("/", authorize(["employee", "hr"]), listLeaves);
// HR: approve/reject
router.patch("/:id/review", authorize(["hr"]), reviewLeave);
// Employee: update own pending leave
router.patch(
  "/:id",
  authorize(["employee", "hr"]),
  handleMedicalDocumentUpload,
  updateLeave,
);
// Employee: delete own pending leave
router.delete("/:id", authorize(["employee", "hr"]), deleteLeave);

export default router;
