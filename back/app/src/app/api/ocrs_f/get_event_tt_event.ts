//==============================================================================
// イベント一覧取得
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
      ,[EVENT_MEI]
      ,[EVENT_KBN]
      ,[EVENT_KBN_MEI]
      ,[KAISAI_KO_CD]
      ,[KAISAI_KO_MEI]
      ,[EVENT_START_TIME]
      ,[EVENT_END_TIME]
      ,[YUKO_KIGEN]
      ,[URL]
      ,[YOYAKU_KIGEN]
      ,[QUALTRICS_URL]
FROM [dbo].[VT_EVENT]
WHERE 0=0
$event_id$
ORDER BY
    event_start_time
;`;

// SQLパラメータ
const sqlPrm: SqlParam[]   = [
    {name : "EVENT_ID" , type : TYPES.VarChar , value : null}
];

// リクエストパラメータ
interface ReqParam {
  event_id?        : string | null;   
}
const allowedParam: (keyof ReqParam)[] = [
  "event_id",
];

export async function get_event_tt_event(req: Request): Promise<ExecResults> {
  const reqParam: ReqParam =  req.body;
  let result;

  // 不要なパラメータをチェック
  result = await validateExtraKeys(reqParam, allowedParam);
  if (result) return [RES_STS.BAD_REQUEST,"error", 1,result];

  // 任意パラメータチェック
  let sqlStr = sqlTemplate;
  // ■コード
  if (reqParam.event_id !== undefined && reqParam.event_id !== null){
    // 型チェック（文字列以外はエラー）
    result = await validateKeyTypes(reqParam, [["event_id", "string"]]);
    if (result) {
	    return [RES_STS.BAD_REQUEST,"ERROR", 1,result];
    }
    // SQLに条件を追加（置換文字を条件に変更）
    sqlStr = sqlStr.replace("$event_id$", "AND EVENT_ID = @EVENT_ID")
  }else{
    // 任意項目が指定されていなかった場合はSQL文から置換文字を削除
    sqlStr = sqlStr.replace("$event_id$", "");
  }
  
  // パラメータ設定
  sqlPrm.forEach(prm => {
    const key = prm.name.toLowerCase() as keyof ReqParam;
    prm.value = (key in reqParam) ? reqParam[key] ?? null : prm.value
  });

  // SQL実行
  return await sqlExecutor(get_event_tt_event.name, sqlStr, sqlPrm) as ExecResults;
}