//==============================================================================
// 認証
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
//==============================================================================
"use strict";
import { Request }     from "express";
import { createHmac }  from "crypto";
import { LOGGER }      from "./log";
import { ExecResults } from "./types";
import { TIME_DIFF_MSEC, ONE_DAY_MSEC, RES_STS, ERR_MSG, SECRET_KEY, APP_KEY } from "./const";

// 日付のハッシュ値取得
function getDateHash(isoDateString: string): string {
  const dateString =  isoDateString.substring(0,4) + isoDateString.substring(5,7) + isoDateString.substring(8,10);
  return createHmac("sha256", SECRET_KEY).update(dateString).digest("hex");
}

export async function authenticate(req: Request): Promise<ExecResults> {
  try {
    LOGGER.debug(`Authorization: ${req.headers.authorization}`);
    // 認証情報の設定有無をチェック
    if (typeof req.headers.authorization === "undefined"){
      // 認証情報が設定されていない場合はエラーを返す
      LOGGER.warn("Authentication information is not set in the HTTP request header.");
      const resDataError = Object.assign({},ERR_MSG.AUTHENTICATION.NOT_SPECIFIED);
      return [RES_STS.UNAUTHORIZED, "error", 1,resDataError];
    }

    // デコード前の認証情報の数をチェック
    if (!(Object.keys(req.headers.authorization.split(" ")).length === 2)){
      // 認証情報がひとつでない場合はエラーを返す
      // ※認証情報は「認証方式 認証情報」の形式を想定しているので、半角空白で分割した際に文字列の数が2でない場合はエラー
      LOGGER.warn(`Authentication information was not one set. [Number of set : ${Object.keys(req.headers.authorization.split(" ")).length}]`);
      const resDataError = Object.assign({},ERR_MSG.AUTHENTICATION.FORMAT_INVALID);
      return [RES_STS.UNAUTHORIZED,"error", 1, resDataError];
    }

    // デコード後の認証情報の数をチェック
    const authArrayKey = ["appKey","authKey"];
    const authBase64Decode: Record<string, string> = {};
    Buffer.from(req.headers.authorization.split(" ")[1], "base64").toString().split(",").forEach((element,index) => authBase64Decode[authArrayKey[index]] = element);
    if (!(Object.keys(authBase64Decode).length === 2)){
      // 認証情報がふたつでない場合はエラーを返す
      // ※Base64方式でデコードしてカンマで区切り形式で参照した際に「アプリキー」、「認証キー」の形式でない場合はエラー
      LOGGER.warn(`Decoded authentication information was not one set. [Number of set : ${Object.keys(authBase64Decode).length}]`);
      const resDataError = [Object.assign({},ERR_MSG.AUTHENTICATION.DECODED_STRING_INVALID)];
      LOGGER.error(`Error data: ${JSON.stringify(resDataError)}`); //debug
      return [RES_STS.UNAUTHORIZED,"error", 1, resDataError];
    }

    // アプリキーをチェック
    if (!(APP_KEY === authBase64Decode.appKey)){
      // アプリキーが想定外の場合はエラーを返す
      LOGGER.warn(`Application key did not match. [Set value : ${authBase64Decode.appKey}]`);
      const resDataError = Object.assign({},ERR_MSG.AUTHENTICATION.UNAUTHORIZED);
      return [RES_STS.UNAUTHORIZED, "error", 1, resDataError];
    }

    // 当日・前日・翌日の日付のhash値を求め、認証情報と一致するかチェック
    const nowDateString  = new Date(Date.now()                + TIME_DIFF_MSEC).toISOString();
    const prevDateString = new Date(Date.now() - ONE_DAY_MSEC + TIME_DIFF_MSEC).toISOString();
    const nextDateString = new Date(Date.now() + ONE_DAY_MSEC + TIME_DIFF_MSEC).toISOString();
    if (!(getDateHash(nowDateString)  === authBase64Decode.authKey) && 
        !(getDateHash(prevDateString) === authBase64Decode.authKey) && 
        !(getDateHash(nextDateString) === authBase64Decode.authKey)){
      // 認証情報と不一致の場合はエラーを返す
      LOGGER.warn(`Authentication key did not match. [Set value : ${authBase64Decode.authKey}]`);
      const resDataError = Object.assign({},ERR_MSG.AUTHENTICATION.UNAUTHORIZED);
      return [RES_STS.UNAUTHORIZED, "error", 1, resDataError];
    }
    return [0, "", 0, {}];
  } catch (err){
    //想定外のエラーが発生した場合はエラーを返す
    let errMsg = "";
    if (err instanceof Error) {
      LOGGER.error(`Error occurred. [Function: ${authenticate.name} Message: ${err.stack}]`);
      errMsg.toString();
    }else{
      LOGGER.error(`Error occurred. [Function: ${authenticate.name} Message: ${err}]`);
    }
    const resDataError = Object.assign({},ERR_MSG.INTERNAL_SERVER_ERROR);
    resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g,`Function: ${authenticate.name}`);
    resDataError.message_detail = resDataError.message_detail.replace(/\{2\}/g,errMsg);
    return [RES_STS.INTERNAL_SERVER_ERROR, "error", 1, resDataError];
  }
};
