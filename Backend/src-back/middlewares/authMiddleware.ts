import { verifyToken } from "../utils/jwt";

export const protect = (req: any, res: any, next: any) => {
  try {
    // Read token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "No token",
      });
    }

    // Verify JWT
    const decoded = verifyToken(token);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};
