// config/config.ts
import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: (process.env.JWT_SECRET as string) || "fdfd",
  jwtExpiration: (process.env.JWT_EXPIRATION as string) || "1d",
  nodeEnv: process.env.NODE_ENV || "development",
  commissionRate: 0.05,
  cookieSettings: {
    name: "token",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

export default config;
