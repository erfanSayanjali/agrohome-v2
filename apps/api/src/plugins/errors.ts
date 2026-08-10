import fp from "fastify-plugin";
import type { FastifyError, FastifyInstance } from "fastify";
import {
  Fa,
  httpErrorBody,
  mapPrismaError,
  toPersianMessage,
} from "../lib/errors";

function statusFromError(err: FastifyError & { statusCode?: number }) {
  if (err.statusCode && err.statusCode >= 400) return err.statusCode;
  if (err.validation) return 400;
  if (err.code === "FST_ERR_CTP_INVALID_MEDIA_TYPE") return 415;
  if (err.code === "FST_ERR_CTP_BODY_TOO_LARGE") return 413;
  if (err.code?.startsWith("FST_ERR_CTP_")) return 400;
  return 500;
}

function messageFromError(err: FastifyError & { statusCode?: number }) {
  if (err.validation?.length) {
    return Fa.validation;
  }
  if (err.code === "FST_ERR_CTP_BODY_TOO_LARGE") return Fa.payloadTooLarge;
  if (err.code === "FST_ERR_CTP_INVALID_MEDIA_TYPE") return Fa.unsupportedMedia;
  if (
    err.code === "FST_ERR_CTP_INVALID_JSON_BODY" ||
    err.code === "FST_ERR_CTP_EMPTY_JSON_BODY"
  ) {
    return Fa.invalidJson;
  }
  return toPersianMessage(err.message);
}

export const errorPlugin = fp(async (app: FastifyInstance) => {
  app.setNotFoundHandler((_request, reply) => {
    const body = httpErrorBody(404, Fa.routeNotFound);
    return reply.status(404).send(body);
  });

  app.setErrorHandler((error, _request, reply) => {
    const prismaMapped = mapPrismaError(error);
    if (prismaMapped) {
      return reply
        .status(prismaMapped.statusCode)
        .send(httpErrorBody(prismaMapped.statusCode, prismaMapped.message));
    }

    const err = error as FastifyError & { statusCode?: number };
    const statusCode = statusFromError(err);
    const message =
      statusCode >= 500
        ? Fa.internal
        : messageFromError(err);

    if (statusCode >= 500) {
      app.log.error({ err }, "Unhandled server error");
    } else {
      app.log.warn({ err: { message: err.message, statusCode } }, "Request error");
    }

    return reply.status(statusCode).send(httpErrorBody(statusCode, message));
  });
});
