import User from "../models/user";
import bcrypt from "bcrypt";
import validator from "validator";
import { generateToken } from "../utils/jwt";

// SIGNUP
export const signup = async (req: any, res: any) => {
  try {
    const { username, email, password, phone, lastSeen } = req.body;

    // ================= VALIDATIONS =================
    // Check required fields
    if (!username || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    // Username validation
    const usernameRegex = /^[A-Za-z][A-Za-z_ ]{2,19}$/;

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message:
          "Username must start with a letter, contain only alphabets, and be between 3 to 20 characters",
      });
    }
    // Email validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    // Password validation
    // Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain uppercase, lowercase, number and special character",
      });
    }
    // Phone validation
    if (!validator.isMobilePhone(phone, "en-IN")) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // ================= CHECK EXISTING USER =================
    const existingUsername = await User.findOne({
      username,
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,

        message: "Username already exists",
      });
    }

    const existingEmail = await User.findOne({
      email,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,

        message: "Email already exists",
      });
    }

    const existingPhone = await User.findOne({
      phone,
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,

        message: "Phone number already exists",
      });
    }

    // ================= HASH PASSWORD =================

    const hashed = await bcrypt.hash(password, 10);

    // ================= CREATE USER =================

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      phone,
      lastSeen,
    });

    // ================= GENERATE TOKEN =================

    const token = generateToken(user._id.toString());

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,

      secure: isProduction,

      sameSite: isProduction ? "none" : "lax",

      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ================= RESPONSE =================

    res.status(201).json({
      success: true,
      message: "Signup successful",

      // token,
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// LOGIN
export const login = async (req: any, res: any) => {
  try {
    const { identifier, phone, password } = req.body;

    // ================= VALIDATIONS =================

    // Required fields
    if (!identifier || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Phone validation
    if (!validator.isMobilePhone(phone, "en-IN")) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // ================= FIND USER =================

    const user = await User.findOne({
      $and: [
        {
          $or: [
            { email: identifier.toLowerCase().trim() },
            { username: identifier.trim() },
          ],
        },
        {
          phone: phone.trim(),
        },
      ],
    });

    // ================= USER CHECK =================

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found with provided credentials",
      });
    }

    // ================= PASSWORD CHECK =================

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }
    // ================= TOKEN =================

    const token = generateToken(user._id.toString());

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // User Data Cookie
    res.cookie(
      "user",

      JSON.stringify({
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
      }),

      {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    );

    // ================= RESPONSE =================

    res.status(200).json({
      success: true,
      message: "Login successful",

      // token,
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const logout = async (req: any, res: any) => {
  res.clearCookie("token");

  res.clearCookie("user");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getMe = async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
        email: user.email,
        phone: user.phone,
        lastSeen: user.lastSeen,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
