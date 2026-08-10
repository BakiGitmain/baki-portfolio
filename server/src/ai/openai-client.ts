import {
  OpenAI,
} from "openai";

import {
  env,
} from "../config/env.js";

/* =========================================================
   MISTRAL CLIENT

   We use the OpenAI SDK as an OpenAI-compatible client,
   but requests are sent to Mistral.
   ========================================================= */

export const openai =
  new OpenAI({
    apiKey:
      env.MISTRAL_API_KEY,

    baseURL:
      "https://api.mistral.ai/v1",
  });