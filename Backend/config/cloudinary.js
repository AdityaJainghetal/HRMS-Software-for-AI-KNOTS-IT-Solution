// config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

const requiredSettings = [
  "CLOUDINARY_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_SECRET_KEY",
];
const missingSettings = requiredSettings.filter(
  (setting) => !process.env[setting]?.trim(),
);

if (missingSettings.length > 0) {
  throw new Error(
    `Missing Cloudinary configuration: ${missingSettings.join(", ")}`,
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});
console.log("✅ Cloudinary configured");

export default cloudinary;
