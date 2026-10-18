import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import getLoginMailOptions from "../Email/login.js";
import getRegisterMailOptions from "../Email/register.js";
import getPasswordResetMailOptions from "../Email/password.js";
import getPasswordChangeConfirmationMailOptions from "../Email/passwordReset.js";
import transporter from "../Email/nodemailer.js";
import { recalcDepartmentStats } from "../utils/departmentStats.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_NAME = "hrmsRefreshToken";
let warnedAboutRefreshSecretFallback = false;

const getRefreshSecret = () => {
  const secret = process.env.REFRESH_TOKEN_SECRET?.trim();
  if (secret) return secret;

  const accessSecret = process.env.JWT_SECRET?.trim();
  if (!accessSecret) {
    throw new Error("Missing JWT_SECRET configuration.");
  }
  if (!warnedAboutRefreshSecretFallback) {
    console.warn(
      "REFRESH_TOKEN_SECRET is not configured; deriving a separate refresh-token key from JWT_SECRET. Configure REFRESH_TOKEN_SECRET in production.",
    );
    warnedAboutRefreshSecretFallback = true;
  }

  return crypto
    .createHmac("sha256", accessSecret)
    .update("hrms-refresh-token")
    .digest();
};

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
});

const createTokens = (user) => ({
  accessToken: jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  ),
  refreshToken: jwt.sign(
    {
      _id: user._id,
      role: user.role,
      tokenType: "refresh",
      jti: crypto.randomUUID(),
    },
    getRefreshSecret(),
    { expiresIn: "30d" },
  ),
});

const saveRefreshSession = async (userId, refreshToken) => {
  const now = new Date();
  await Employee.updateOne(
    { _id: userId },
    { $pull: { refreshSessions: { expiresAt: { $lte: now } } } },
  );
  await Employee.updateOne(
    { _id: userId },
    {
      $push: {
        refreshSessions: {
          tokenHash: hashRefreshToken(refreshToken),
          expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
        },
      },
    },
  );
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieOptions(),
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
};

const clearRefreshCookie = (res) =>
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());

export const register = async (req, res) => {
  try {
    const { name, email, role, department, departmentId, password, confirmPassword, avatar } = req.body;

    if (!name || !email || !role || !password || !confirmPassword || (!department && !departmentId)) {
      return res.status(400).json({ status: false, message: "All fields are required" });
    }

    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ status: false, message: "Employee already exist" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: false, message: "Passwords do not match" });
    }

    // Resolve department document
    let depDoc = null;
    if (departmentId) depDoc = await Department.findById(departmentId);
    else if (department) depDoc = await Department.findOne({ name: department });
    if (!depDoc) {
      return res.status(400).json({ status: false, message: "Invalid department" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new Employee({
      name,
      email,
      role,
      department: depDoc._id,
      password: hashedPassword,
      profileImage: avatar,
    });
    await user.save();

    // Increment department count
  await Department.findByIdAndUpdate(depDoc._id, { $inc: { employeeCount: 1 } });
  // Recalculate stats (avg salary may remain zero if no salary set yet)
  await recalcDepartmentStats(depDoc._id);

    const { accessToken, refreshToken } = createTokens(user);
    await saveRefreshSession(user._id, refreshToken);
    setRefreshCookie(res, refreshToken);

    transporter.sendMail(
      getRegisterMailOptions(user.email, user.name),
      (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Email sent:", info.response);
        }
      }
    );

    // Return populated user for client convenience
    const populated = await Employee.findById(user._id).populate({ path: 'department', select: 'name' });

    res.status(201).json({
      status: true,
      message: "Employee registered successfully",
      data: {
        user: populated,
        token: accessToken,
      },
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail || !password || !role) {
      return res.status(400).json({
        status: false,
        message: "Email, password, and role are required.",
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        status: false,
        message: "Please enter a valid email address.",
      });
    }

    const user = await Employee.findOne({ email: normalizedEmail }).collation({
      locale: "en",
      strength: 2,
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: false,
        message: "Incorrect email or password.",
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        status: false,
        message: "The selected account type does not match this account.",
      });
    }

    const { accessToken, refreshToken } = createTokens(user);
    await saveRefreshSession(user._id, refreshToken);
    setRefreshCookie(res, refreshToken);

    transporter.sendMail(
      getLoginMailOptions(user.email, user.name),
      (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Email sent:", info.response);
        }
      }
    );

    res.status(200).json({
      status: true,
      message: "Login successful",
      data: {
        user,
        token: accessToken,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({
      status: false,
      message: "Unable to sign in right now. Please try again later.",
    });
  }
};

export const refreshSession = async (req, res) => {
  const currentRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!currentRefreshToken) {
    return res.status(401).json({
      status: false,
      message: "Refresh token missing.",
    });
  }

  try {
    const decoded = jwt.verify(currentRefreshToken, getRefreshSecret());
    if (decoded.tokenType !== "refresh") {
      clearRefreshCookie(res);
      return res.status(401).json({
        status: false,
        message: "Invalid refresh token.",
      });
    }

    const currentHash = hashRefreshToken(currentRefreshToken);
    const user = await Employee.findById(decoded._id);
    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({
        status: false,
        message: "Session is no longer valid.",
      });
    }

    const { accessToken, refreshToken } = createTokens(user);
    const now = new Date();
    const session = await Employee.findOneAndUpdate(
      {
        _id: user._id,
        refreshSessions: {
          $elemMatch: {
            tokenHash: currentHash,
            expiresAt: { $gt: now },
          },
        },
      },
      {
        $set: {
          "refreshSessions.$.tokenHash": hashRefreshToken(refreshToken),
          "refreshSessions.$.expiresAt": new Date(
            now.getTime() + REFRESH_TOKEN_TTL_MS,
          ),
          "refreshSessions.$.previousTokenHash": currentHash,
          "refreshSessions.$.previousExpiresAt": new Date(now.getTime() + 30_000),
        },
      },
      { new: true },
    );
    if (!session) {
      const isConcurrentRefresh = await Employee.findOne({
        _id: user._id,
        refreshSessions: {
          $elemMatch: {
            previousTokenHash: currentHash,
            previousExpiresAt: { $gt: now },
            expiresAt: { $gt: now },
          },
        },
      });
      if (isConcurrentRefresh) {
        return res.status(200).json({
          status: true,
          data: {
            user,
            token: jwt.sign(
              { _id: user._id, role: user.role },
              process.env.JWT_SECRET,
              { expiresIn: ACCESS_TOKEN_TTL },
            ),
          },
        });
      }
      clearRefreshCookie(res);
      return res.status(401).json({
        status: false,
        message: "Session is no longer valid.",
      });
    }

    setRefreshCookie(res, refreshToken);
    return res.status(200).json({
      status: true,
      data: { user, token: accessToken },
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      clearRefreshCookie(res);
      return res.status(401).json({
        status: false,
        message: "Refresh token is invalid or expired.",
      });
    }
    console.error("Session refresh failed:", error);
    return res.status(500).json({
      status: false,
      message: "Could not refresh session.",
    });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  try {
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, getRefreshSecret());
        await Employee.updateOne(
          { _id: decoded._id },
          {
            $pull: {
              refreshSessions: { tokenHash: hashRefreshToken(refreshToken) },
            },
          },
        );
      } catch (error) {
        if (
          error.name !== "JsonWebTokenError" &&
          error.name !== "TokenExpiredError"
        ) {
          throw error;
        }
      }
    }
    clearRefreshCookie(res);
    return res.status(200).json({ status: true, message: "Logged out." });
  } catch (error) {
    console.error("Logout failed:", error);
    clearRefreshCookie(res);
    return res.status(500).json({
      status: false,
      message: "Could not revoke session.",
    });
  }
};

export const forgetPasswordRequest = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Email is required",
      });
    }

    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User doesn't exist",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiry (10 minutes)
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    transporter.sendMail(
      getPasswordResetMailOptions(user.email, user.name, user.otp),
      (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Email sent:", info.response);
        }
      }
    );

    res.status(200).json({
      status: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error: " + error,
    });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and OTP are required",
      });
    }

    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User doesn't exist",
      });
    }

    console.log("DB OTP:", user.otp, "Received OTP:", otp);

    // safer: cast to string and trim
    if (
      String(user.otp) !== String(otp).trim() ||
      user.otpExpiry < Date.now()
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid or expired OTP",
      });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate a secure reset token (valid for 15 minutes)
    const resetToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      status: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("verifyOTP error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  const { resetToken, newPassword, confirmNewPassword } = req.body;
  try {
    if (!resetToken || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        status: false,
        message: "New passwords do not match",
      });
    }

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: "Invalid or expired reset token",
      });
    }

    const user = await Employee.findById(decoded._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User doesn't exist",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    transporter.sendMail(
      getPasswordChangeConfirmationMailOptions(user.email, user.name),
      (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Email sent:", info.response);
        }
      }
    );

    res.status(200).json({
      status: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error: " + error,
    });
  }
};

export const changePassword = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  try {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "New passwords do not match",
      });
    }

    const user = await Employee.findById(id);
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User doesn't exist",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Old password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    transporter.sendMail(
      getPasswordChangeConfirmationMailOptions(user.email, user.name),
      (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Email sent:", info.response);
        }
      }
    );

    res.status(200).json({
      status: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error: " + error,
    });
  }
};
