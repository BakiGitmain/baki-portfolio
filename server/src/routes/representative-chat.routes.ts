import {
  requireRepresentative,
  requireRepresentativeReady,
} from "../middleware/representative-auth.middleware.js";

import {
  createPartnerChatRouter,
} from "./partner-chat-router.js";

export default createPartnerChatRouter({
  role:
    "representative",

  auth: [
    requireRepresentative,
    requireRepresentativeReady,
  ],
});
