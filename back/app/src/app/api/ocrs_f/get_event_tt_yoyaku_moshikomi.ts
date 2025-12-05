//==============================================================================
// 申込リスト取得
//------------------------------------------------------------------------------
// 変更履歴
// 2025-09-01 ayako.urushido 新規作成
//==============================================================================
"use strict";
import { Request }               from "express";
import { TYPES }                 from "tedious";
import { RES_STS }               from "../../../common/const";
import { SqlParam, ExecResults } from "../../../common/types";
import { sqlExecutor }           from "../../../common/sqlExecutor"
import { validateExtraKeys, validateRequiredKeys, validateDateTimeFormatAndRange, validateKeyTypes, validateKeySizes } from "../../../common/validation";

// SQL
const sqlTemplate = `
USE EVENTDB

SELECT
       [EVENT_ID]
      ,[ID]
      ,[EMAIL]
      ,[SHIMEI]
      ,[CLASS_CD]
      ,[CLASS_HYOJI]
      ,[PRIORITY]
      ,[WAITING_FLG]
      ,[GMS_KOKYAKU_ID]
      ,[MOSHIKOMI_NO]
      ,[MOSHIKOMI_GYO]
      ,[RENKEI_ZUMI_FLG]
  FROM [dbo].[VT_YOYAKU_MOSHIKOMI]
WHERE
	[EVENT_ID] = @EVENT_ID
;`;

// SQLパラメータ
const sqlPrm: SqlParam[]   = [
  {name : "EVENT_ID" , type : TYPES.VarChar , value : null}
];

// リクエストパラメータ
interface ReqParam {
  event_id        : string;
}
const allowedParam: (keyof ReqParam)[] = [
  "event_id"
];

export async function get_event_tt_yoyaku_moshikomi(req: Request): Promise<ExecResults> {
  const reqParam: ReqParam =  req.body;
  let result;

  // 不要なパラメータをチェック
  result = await validateExtraKeys(reqParam, allowedParam);
  if (result) return [RES_STS.BAD_REQUEST,"error", 1,result];

  // 必須パラメータチェック
  result = await validateRequiredKeys(reqParam, ["event_id"]); if (result) return [RES_STS.BAD_REQUEST,"ERROR", 1,result];

  // 型チェック（文字列以外はエラー）
  result = await validateKeyTypes(reqParam, [["event_id", "string"]]); if (result) return [RES_STS.BAD_REQUEST,"ERROR", 1,result];

  let sqlStr = sqlTemplate;
  
  sqlPrm.forEach(prm => {
    const key = prm.name.toLowerCase() as keyof ReqParam;
    prm.value = (key in reqParam) ? reqParam[key] ?? null : prm.value
  });

  // SQL実行
  return await sqlExecutor(get_event_tt_yoyaku_moshikomi.name, sqlStr, sqlPrm) as ExecResults;
}
