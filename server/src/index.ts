import {
  createServer,
} from "node:http";

import app from "./app.js";

import {
  env,
} from "./config/env.js";

import {
  createPartnerChatSocketServer,
} from "./socket/partner-chat.socket.js";

const httpServer =
  createServer(
    app,
  );

await createPartnerChatSocketServer(
  httpServer,
);

httpServer.listen(
  env.PORT,
  () => {
    console.log(
      `🚀 Server running on http://localhost:${env.PORT}`,
    );

    console.log(
      `Environment: ${env.NODE_ENV}`,
    );
  },
);
