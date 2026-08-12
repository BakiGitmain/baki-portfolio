import {
  Router,
} from "express";

import {
  requireRepresentative,
  requireRepresentativeReady,
} from "../middleware/representative-auth.middleware.js";

import {
  listRepresentativePrograms,
} from "../services/partner-program.service.js";

const router =
  Router();

router.use(
  requireRepresentative,
  requireRepresentativeReady,
);

router.get(
  "/",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const programs =
        await listRepresentativePrograms(
          req.auth!.id,
        );

      res.json({
        success:
          true,

        programs,
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

export default router;
