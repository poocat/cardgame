export const STATUS = {
  /** 200-OK */
  ok: 200,
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
} as const;
