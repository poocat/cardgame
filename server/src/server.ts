import express from "express";
import { games } from "@server/api/routes/games";

export function createServer() {
	const app = express();
	app.use(express.json());

	// Routes:
	app.use("/games", games);

	return app;
}
