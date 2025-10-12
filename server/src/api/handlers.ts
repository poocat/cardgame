/**
 * Use the `handlers` helper when defining endpoint handlers, to add
 * schema validation with Zod.
 */

// handlers.ts
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

function validateHandler<TSchemas extends RouteSchemas>(
	schemas: RouteSchemas,
): ValidatedRequestHandler<TSchemas> {
	return (req, res, next) => {
		try {
			if (schemas.requestParams) schemas.requestParams.parse(req.params);
			if (schemas.requestQuery) schemas.requestQuery.parse(req.query);
			if (schemas.requestBody) schemas.requestBody.parse(req.body);
		} catch (err) {
			if (err instanceof ZodError) {
				// 400-Bad Request
				return res.status(400).json({ message: err.message });
			}
			return next(err);
		}
		next();
	};
}

/**
 * Use to generate a pipeline of route handlers, with the given `handler`
 * callback at the end.
 */
export function handlers<TSchemas extends RouteSchemas>(args: {
	schemas: TSchemas;
	handler: ValidatedRequestHandler<TSchemas>;
}): ValidatedRequestHandler<TSchemas>[] {
	// Wrap the handler so that any uncaught errors will get handled by express's
	// default error handler.
	const wrappedHandler: ValidatedRequestHandler<TSchemas> = (
		req,
		res,
		next,
	) => {
		Promise.resolve(args.handler(req, res, next)).catch(next);
	};
	return [
		// Validate request from schemas.
		validateHandler(args.schemas),
		// Handle route request.
		wrappedHandler,
	];
}
