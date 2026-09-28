import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "leave-medical-certificates",
    resource_type: "raw",
    public_id: (req, file) =>
      `${Date.now()}-${file.originalname.replace(/\.pdf$/i, "")}`,
    format: "pdf",
  },
});

const uploadLeaveDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const isPdf =
      file.mimetype === "application/pdf" && /\.pdf$/i.test(file.originalname);
    callback(
      isPdf ? null : new Error("Medical document must be a PDF file."),
      isPdf,
    );
  },
});

export default uploadLeaveDocument;
