import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
	port: process.env.PORT || 7000,
	nodeEnv: process.env.NODE_ENV || "development",
};
