import { verifyToken } from "../utils/jwt";

export const protect = (req: any, res: any, next: any) => {
  
  console.log("Cookies:", req.cookies);
  console.log("Auth:", req.headers.authorization);
  try {
    let token = req.cookies?.token;

    if (
      !token &&
      req.headers.authorization?.startsWith("Bearer ")
    ) {
      token =
        req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "No token",
      });
    }

    const decoded = verifyToken(token);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};