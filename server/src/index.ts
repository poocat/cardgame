import express from "express";
import { games } from "@server/api/games/route";

const PORT = "7000";

try {
	const app = express();
	app.use("/games", games);
	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	});
} catch (error) {
	console.log(error);
}
