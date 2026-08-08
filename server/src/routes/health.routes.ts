import {
  Router,
} from "express";

import {
  testDatabaseConnection,
} from "../config/db.js";

const router =
  Router();

router.get(
  "/",
  async (
    _req,
    res,
  ) => {
    const databaseTime =
      await testDatabaseConnection();

    res.json({
      success: true,

      message:
        "Baki Portfolio API is running",

      database:
        "connected",

      databaseTime,
    });
  },
);

export default router;