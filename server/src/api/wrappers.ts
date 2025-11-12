/**
 * Use to add type inference and validation to route handlers with Zod schemas.
 */
import { RequestHandler } from "express";
import { z, ZodError, ZodObject, ZodRawShape } from "zod";

export type ErrorResponseBody = { message: string };

export type RouteSchemas = {
  requestBody?: ZodObject<ZodRawShape>;
  requestParams?: ZodObject<ZodRawShape>;
  requestQuery?: ZodObject<ZodRawShape>;
  responseBody?: ZodObject<ZodRawShape>;
  responseHeaders?: ZodObject<ZodRawShape>;
};

type ValidatedRequestHandler<TSchemas extends RouteSchemas> = RequestHandler<
  z.infer<TSchemas["requestParams"]>,
  z.infer<TSchemas["responseBody"]> | ErrorResponseBody,
  z.infer<TSchemas["requestBody"]>,
  z.infer<TSchemas["requestQuery"]>
>;

/******************************************************************************
 * ### validated
 *
 * Use to wrap a request handler to type constrain and/or validate the request
 * and response.
 ******************************************************************************/
export function validated<TSchemas extends RouteSchemas>(args: {
  schemas: TSchemas;
  handler: ValidatedRequestHandler<TSchemas>;
}): ValidatedRequestHandler<TSchemas> {
  return async (req, res, next) => {
    try {
      if (args.schemas.requestParams) {
        args.schemas.requestParams.parse(req.params);
      }
      if (args.schemas.requestQuery) {
        args.schemas.requestQuery.parse(req.query);
      }
      if (args.schemas.requestBody) {
        args.schemas.requestBody.parse(req.body);
      }
    } catch (err) {
      if (err instanceof ZodError) {
        // 400-Bad Request
        return res.status(400).json({ message: err.message });
      }
      return next(err);
    }
    // Make sure any uncaught errors in the handler will get handled by
    // Express's default error handler.
    return Promise.resolve(args.handler(req, res, next)).catch(next);
  };
}
