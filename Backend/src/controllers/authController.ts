import User from "../models/user";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";

// SIGNUP
export const signup = async (req:any, res:any) => {
  try {
    const { username, email, password ,phone , lastSeen } = req.body;

    const existing = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existing) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
      phone,
      lastSeen,
    });

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// LOGIN
export const login = async (req:any, res:any) => {
  try {
    const { identifier, password } = req.body; // username OR email

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};