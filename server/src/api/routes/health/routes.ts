import { ROUTES } from "@common/api/routes";
import { STATUS } from "@server/api/status";
import { validated } from "@server/api/wrappers";
import { Router } from "express";

export const healthRouter = {
  path: ROUTES.health.path,
  create: () => {
    const router = Router();

    router.get(
      ROUTES.health.methods.get.path,
      validated({
        schemas: ROUTES.health.methods.get.schemas,
        handler: async (_req, res) => {
          res.status(STATUS.ok).json({});
        },
      }),
    );

    return router;
  },
};
