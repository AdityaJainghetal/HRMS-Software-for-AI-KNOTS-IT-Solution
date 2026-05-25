// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// export default transporter;


// const nodemailer = require("nodemailer");
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtpout.secureserver.net",
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default transporter;
