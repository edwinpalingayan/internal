//==============================================================================
// レスポンス送信
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
//==============================================================================
"use strict";
import { Response }         from "express";
import { LOGGER }           from "./log";
import { ResponseEnvelope } from "./types";

// 処理時間取得
function getProcessTime(hrStart: bigint): string {
  const hrEnd = process.hrtime.bigint();
  const divisor = BigInt("1000000000");
  return ((hrEnd - hrStart) / divisor).toString().concat(".").concat("000000000".concat((hrEnd - hrStart).toString()).slice(-9));
}

// レスポンス送信
export async function send(res: Response, statusCode: number, name: string, resCount: number, resData: any,hrStart: string){
  const resEnvelope: ResponseEnvelope = { name: "", count: 0, data: null }; 
  resEnvelope.name  = name;
  resEnvelope.count = resCount;
  resEnvelope.data  = resData;
  res.status(statusCode).send(JSON.stringify(resEnvelope));
  LOGGER.info(`Response sended. [Status code: ${statusCode} Processing time: ${getProcessTime(BigInt(hrStart))} seconds]`);
};
