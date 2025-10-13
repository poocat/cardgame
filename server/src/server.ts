import express from "express";
import { games } from "@server/api/games/route";

export function createServer() {
	const app = express();
	app.use(express.json());

	// Routes:
	app.use("/games", games);

	return app;
}
