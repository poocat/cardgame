export const STATUS = {
  /** 200-OK */
  ok: 200,
  /** 201-Created */
  created: 201,
  /** 204-No Content; indicates success, should trigger client to make another request */
  noContent: 204,
  /** 304-Not Modified; indicates requested content is not modified, for conditional GET requests */
  notModified: 304,
  /** 400-Bad Request */
  badRequest: 400,
  /** 403-Forbidden */
  forbidden: 403,
  /** 404-Not Found */
  notFound: 404,
  /** 409-Conflict */
  conflict: 409,
  /** 429-Too Many Requests */
  tooManyRequests: 429,
  /** 500-Internal Server Error */
  internalServerError: 500,
} as const;
