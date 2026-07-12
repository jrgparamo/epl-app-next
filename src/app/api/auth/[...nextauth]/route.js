// Auth.js v5 catch-all route. Delegates to the config in `src/auth.js`.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// The passkey provider requires the Node.js runtime.
export const runtime = "nodejs";
