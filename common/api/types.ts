import type { ZodObject, ZodRawShape } from "zod";

export type MethodSchemas = {
  requestBody?: ZodObject<ZodRawShape>;
  requestParams?: ZodObject<ZodRawShape>;
  requestQuery?: ZodObject<ZodRawShape>;
  responseBody?: ZodObject<ZodRawShape>;
  responseHeaders?: ZodObject<ZodRawShape>;
};
export type MethodSpec = {
  path: string;
  schemas: MethodSchemas;
};
export type RouteSpec = {
  path: string;
  methods: Partial<Record<string, MethodSpec>>;
};
export type Routes = Record<string, RouteSpec>;
