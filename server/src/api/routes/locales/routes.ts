import { ROUTES } from "@common/api/routes";
import { STATUS } from "@server/api/status";
import { validated } from "@server/api/wrappers";
import { getLocaleBundle } from "@server/text/registry";
import { Router } from "express";

export const localesRouter = {
  path: ROUTES.locales.path,
  create: () => {
    const router = Router();

    router.get(
      ROUTES.locales.methods.get.path,
      validated({
        schemas: ROUTES.locales.methods.get.schemas,
        handler: async (req, res) => {
          const localeBundle = getLocaleBundle(req.params.locale);
          if (localeBundle === null) {
            return res
              .status(STATUS.notFound)
              .json({ message: `No bundle for locale: ${req.params.locale}` });
          }
          res.status(STATUS.ok).json({ bundle: localeBundle });
        },
      }),
    );

    return router;
  },
};
