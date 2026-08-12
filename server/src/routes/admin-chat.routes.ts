import {
  requireAdmin,
} from "../middleware/auth.middleware.js";

import {
  createPartnerChatRouter,
} from "./partner-chat-router.js";

export default createPartnerChatRouter({
  role:
    "admin",

  auth: [
    requireAdmin,
  ],
});
