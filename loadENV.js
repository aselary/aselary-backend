import dotenv from "dotenv";
import isDev from "./features/utils/isDev.js";

const env = process.env.NODE_ENV || "development";

dotenv.config({
  path: env === "production"
    ? ".env.production"
    : ".env.development",
});

if (isDev) {
console.log("ENV LOADED:", env);
}
