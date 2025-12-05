//==============================================================================
// 予約申込更新
//------------------------------------------------------------------------------
// 変更履歴
// 2025-09-12 iwamura 新規作成
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
EXECUTE SP_UPDATE_TT_YOYAKU_MOSHIKOMI
    @ID,
    @EVENT_ID,
    @CLASS_CD,
    @PRIORITY,
    @GMS_KOKYAKU_ID,
    @koshin_id
;`;

// SQLパラメータ
const sqlPrm: SqlParam[]   = [
  {name : "ID"      , type : TYPES.VarChar , value : null},
  {name : "EVENT_ID", type : TYPES.VarChar , value : null},
  {name : "CLASS_CD", type : TYPES.VarChar , value : null},
  {name : "PRIORITY", type : TYPES.VarChar , value : null},
  {name : "GMS_KOKYAKU_ID", type : TYPES.VarChar , value : null},
  {name : "KOSHIN_ID", type : TYPES.VarChar , value : null},
];

// リクエストパラメータ
interface ReqParam {
  id                : string;
  event_id          : string;
  class_cd          : string;
  priority          : string;
  gms_kokyaku_id    : string;
  koshin_id    : string;
}
const allowedParam: (keyof ReqParam)[] = [
  "id",
  "event_id",
  "class_cd",
  "priority",
  "gms_kokyaku_id",
  "koshin_id"
];

export async function patch_tt_yoyaku_moshikomi(req: Request): Promise<ExecResults> {
  const reqParam: ReqParam =  req.body;
  let result;

  // 不要なパラメータをチェック
  result = await validateExtraKeys(reqParam, allowedParam);
  if (result) return [RES_STS.BAD_REQUEST,"error", 1,result];

  // 必須パラメータチェック
  result = await validateRequiredKeys(reqParam, [ "id","event_id", "class_cd", "priority","gms_kokyaku_id","koshin_id"]);
  if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];
 
  // 型チェック 
   result = await validateKeyTypes(reqParam, [["id","string"],["event_id","string"],["class_cd","string"],["priority","string"],["gms_kokyaku_id","string"],["koshin_id","string"]]);
   if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];

  // サイズチェック
   result = await validateKeySizes(reqParam, [["id",10],["event_id",12],["class_cd",10],["priority",10],["gms_kokyaku_id",10],["koshin_id",30]]);
   if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];

   let sqlStr = sqlTemplate;

  // パラメータ設定
  sqlPrm.forEach(prm => {
    const key = prm.name.toLowerCase() as keyof ReqParam;
    prm.value = (key in reqParam) ? reqParam[key] ?? null : prm.value
  });

  // SQL実行
  return await sqlExecutor(patch_tt_yoyaku_moshikomi.name, sqlStr, sqlPrm) as ExecResults;
}