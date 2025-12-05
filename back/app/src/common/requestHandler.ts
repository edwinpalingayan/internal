//==============================================================================
// リクエスト処理
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
//==============================================================================
"use strict";
import { Request, Response, NextFunction } from "express";
import { randomUUID }                      from "crypto";
import { authenticate }                    from "./authentication";
import { send }                            from "./sendResponse";
import { LOGGER }                          from "./log";
import { appExecutor }                     from "./appExecutor";
import { RES_STS, ERR_MSG, ROOT_PATH, HEALTH_CHECK_PATH } from "./const";

// 全てのリクエストの共通処理
export async function allRequestHandler(req: Request, res: Response, next: NextFunction){
  try {
    // 開始処理
    res.locals.xRequestId = randomUUID();
    res.locals.xTraceId = req.get("X-Amzn-Trace-Id") || "";
    res.setHeader("X-Request-Id",res.locals.xRequestId);
    res.setHeader("X-Trace-Id",res.locals.xTraceId);
    LOGGER.addContext("requestId", res.locals.xRequestId);
    LOGGER.addContext("traceId", res.locals.xTraceId);
    
    // ルートとfaviconとヘルスチェックへのリクエストはステータスコードのみを返す
    if (req.path === ROOT_PATH || req.path === `${ROOT_PATH}favicon.ico` || req.path === HEALTH_CHECK_PATH){
      LOGGER.info(`Request accepted. [Method: ${req.method} URL: ${req.originalUrl} User-Agent: ${req.get("user-Agent")} Client-IP: ${req.ip} x-forwarded-for: ${req.get("x-forwarded-for")}] Response sended [Status code: 200]`);
      res.status(200).send();
      return;
    }
    LOGGER.info(`Request accepted. [Method: ${req.method} URL: ${req.originalUrl} User-Agent: ${req.get("user-Agent")} Client-IP: ${req.ip} x-forwarded-for: ${req.get("x-forwarded-for")}]`);

    // POST以外のメソッドの場合はエラーを返す
    // if (req.method !== "POST"){
    //   LOGGER.warn("Requested method is not a processing target.");
    //   const resDataError = Object.assign({},ERR_MSG.METHOD_NOT_ALLOWED);
    //   resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g,req.method);
    //   await send(res,RES_STS.METHOD_NOT_ALLOWED,1,resDataError,res.get("X-Process-Start-Time")!);
    //   return;
    // }
    
    // 認証処理
    let [httpStatusCode, errorString, rowCount, result] = await authenticate(req);
    if (httpStatusCode){
      // 認証に失敗した場合（ステータスコードに何か設定されている場合）はエラーを返す
      await send(res, httpStatusCode, errorString, rowCount, result, res.get("X-Process-Start-Time")!);
      return;
    }
  } catch (err){
    // 想定外のエラーが発生した場合はエラーを返す
    let errMsg = "";
    if (err instanceof Error) {
      LOGGER.error(`Error occurred. [Function: ${allRequestHandler.name} Message: ${err.stack}]`);
      errMsg = err.toString();
    }else{
      LOGGER.error(`Error occurred. [Function: ${allRequestHandler.name} Message: ${err}]`);
    }
    const resDataError = Object.assign({},ERR_MSG.INTERNAL_SERVER_ERROR);
    resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g,`Function: ${allRequestHandler.name}`);
    resDataError.message_detail = resDataError.message_detail.replace(/\{2\}/g,errMsg);
    await send(res, RES_STS.INTERNAL_SERVER_ERROR, "error", 1, resDataError, res.get("X-Process-Start-Time")!);
    return;
  }
  next();
};

// POSTメソッドの処理
export async function postMethodHandler(req: Request, res: Response){
  try {
    // アプリ実行用のモジュールを呼び出して処理結果を返す
    const [httpStatusCode, name, rowCount, result] = await appExecutor(req, res);
    await send(res, httpStatusCode, name, rowCount, result, res.get("X-Process-Start-Time")!);
  } catch (err){
    // 想定外のエラーが発生した場合はエラーを返す
    let errMsg = "";
    if (err instanceof Error) {
      LOGGER.error(`Error occurred. [Function: ${postMethodHandler.name} Message: ${err.stack}]`);
      errMsg = err.toString();
    }else{
      LOGGER.error(`Error occurred. [Function: ${postMethodHandler.name} Message: ${err}]`);
    }
    const resDataError = Object.assign({},ERR_MSG.INTERNAL_SERVER_ERROR);
    resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g,`Function: ${postMethodHandler.name}`);
    resDataError.message_detail = resDataError.message_detail.replace(/\{2\}/g,errMsg);
    await send(res, RES_STS.INTERNAL_SERVER_ERROR, "error", 1, resDataError, res.get("X-Process-Start-Time")!);
  }
  return;
};

