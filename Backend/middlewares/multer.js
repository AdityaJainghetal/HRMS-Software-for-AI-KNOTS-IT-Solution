import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const backendRoot = fileURLToPath(new URL("..", import.meta.url));
const uploadDirectory = path.join(backendRoot, "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + path.basename(file.originalname));
  },
});

const upload = multer({ storage });

export default upload;
