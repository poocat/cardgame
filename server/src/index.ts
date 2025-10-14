import { createServer } from "@server/server";
import { CONFIG } from "@server/config";

const app = createServer();

app.listen(CONFIG.port, () => {
  console.log(`Server running on port ${CONFIG.port} (${CONFIG.nodeEnv})`);
});
