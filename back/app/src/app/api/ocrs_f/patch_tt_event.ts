//==============================================================================
// TT_VENT更新
//------------------------------------------------------------------------------
// 変更履歴
// 2025-11-25 ayako.urushido　新規作成
//==============================================================================
"use strict";
import { Request }               from "express";
import { TYPES }                 from "tedious";
import { RES_STS }               from "../../../common/const";
import { SqlParam, ExecResults } from "../../../common/types";
import { sqlExecutor }           from "../../../common/sqlExecutor"
import { validateExtraKeys, validateRequiredKeys, validateKeyTypes, validateKeySizes, validateZodKeys } from "../../../common/validation";

// SQL
const sqlTemplate = `
UPDATE TT_EVENT
SET
  YOYAKU_KIGEN = @YOYAKU_KIGEN
  ,QUALTRICS_URL = @QUALTRICS_URL
FROM TT_EVENT
WHERE EVENT_ID = @EVENT_ID
;`;

// SQLパラメータ
const sqlPrm: SqlParam[]   = [
  {name : "EVENT_ID", type : TYPES.VarChar , value : null},
  {name : "YOYAKU_KIGEN", type : TYPES.VarChar , value : null},
  {name : "QUALTRICS_URL", type : TYPES.VarChar , value : null},
  {name : "KOSHIN_ID", type : TYPES.VarChar , value : null},
];

// リクエストパラメータ
interface ReqParam {
  event_id          : string;
  yoyaku_kigen          : string;
  qualtrics_url         : string;
  koshin_id    : string;
}
const allowedParam: (keyof ReqParam)[] = [
  "event_id",
  "yoyaku_kigen",
  "qualtrics_url",
  "koshin_id"
];

export async function patch_tt_event(req: Request): Promise<ExecResults> {
  const reqParam: ReqParam =  req.body;
  let result;

  // 不要なパラメータをチェック
  result = await validateExtraKeys(reqParam, allowedParam);
  if (result) return [RES_STS.BAD_REQUEST,"error", 1,result];

  // 必須パラメータチェック
  result = await validateRequiredKeys(reqParam, [ "event_id", "yoyaku_kigen" ,"qualtrics_url","koshin_id"]);
  if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];
 
  // 型チェック 
   result = await validateKeyTypes(reqParam, [["event_id","string"],["yoyaku_kigen","string"],["qualtrics_url","string"],["koshin_id","string"]]);
   if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];

  // サイズチェック
   result = await validateKeySizes(reqParam, [["event_id",12],["qualtrics_url",244],["koshin_id",30]]);
   if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];

   let sqlStr = sqlTemplate;

  // パラメータ設定
  sqlPrm.forEach(prm => {
    const key = prm.name.toLowerCase() as keyof ReqParam;
    prm.value = (key in reqParam) ? reqParam[key] ?? null : prm.value
  });

  // SQL実行
  return await sqlExecutor(patch_tt_event.name, sqlStr, sqlPrm) as ExecResults;
}