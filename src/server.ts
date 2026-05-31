import { createApp } from "./app.js";
import { getEnv } from "./lib/env.js";

const env = getEnv();
const app = createApp();

app.listen(env.PORT, () => {
  console.log(`SAI Manager API running on port ${env.PORT}`);
});
