import OpenAI from "openai";

import {
  env,
} from "../config/env.js";

/* =========================================================
   MISTRAL CLIENT

   We keep using the OpenAI npm package because Mistral
   provides an OpenAI-compatible API.

   IMPORTANT:
   This client is talking to Mistral, NOT OpenAI.
   ========================================================= */

export const openai =
  new OpenAI({
    apiKey:
      env.MISTRAL_API_KEY,

    baseURL:
      "https://api.mistral.ai/v1",
  });