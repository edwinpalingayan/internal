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
import { StoredProcParam, SPExecResults, ExecResults } from "../../../common/types";
import { spExecutor }           from "../../../common/sqlExecutor"
import { validateExtraKeys, validateRequiredKeys, validateKeyTypes, validateKeySizes, validateZodKeys } from "../../../common/validation";

// SQL
// ストアド名
const SPName = `SP_UPDATE_TT_YOYAKU_MOSHIKOMI`;

// ストアドパラメータ
const spPrm: StoredProcParam[]   = [
  {name : "ID", type : TYPES.Int , value : null, isOutput:false},
  {name : "EVENT_ID", type : TYPES.VarChar , value : null, isOutput:false},
  {name : "CLASS_CD", type : TYPES.VarChar , value : null, isOutput:false},
  {name : "PRIORITY", type : TYPES.Int , value : null, isOutput:false},
  {name : "GMS_KOKYAKU_ID", type : TYPES.VarChar , value : null, isOutput:false},
  {name : "KOSHIN_ID", type : TYPES.VarChar , value : null, isOutput:false}
];

// リクエストパラメータ
interface ReqParam {
  id              : number;
  event_id        : string;
  class_cd        : string;
  priority        : number;
  gms_kokyaku_id  : string;
  koshin_id       : string;
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
  result = await validateRequiredKeys(reqParam, [ "id","event_id", "class_cd", "priority", "gms_kokyaku_id", "koshin_id"]);
  if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];
 
  // 型チェック 
  result = await validateKeyTypes(reqParam, [["id","number"],["event_id","string"],["class_cd","string"],["priority","number"],["gms_kokyaku_id","string"],["koshin_id","string"]]);
  if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];

  // サイズチェック
  result = await validateKeySizes(reqParam, [["event_id",12],["class_cd",10],["gms_kokyaku_id",10],["koshin_id",30]]);
  if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];

  //INPUTパラメータの値を設定
  const currentSpPrm = spPrm.map(p => ({ ...p })); 
  currentSpPrm.forEach(prm => {
    const key = prm.name.toLowerCase() as keyof ReqParam;
    prm.value = (key in reqParam) ? reqParam[key] ?? null : prm.value;
  });
  // spPrm.forEach(prm => {
  //   const key = prm.name.toLowerCase() as keyof ReqParam;
  //   prm.value = (key in reqParam) ? reqParam[key] ?? null : prm.value
  // });
  
  //ストアド実行
  const SPResult = await spExecutor(patch_tt_yoyaku_moshikomi.name, SPName, currentSpPrm) as SPExecResults;
  const [ returnCode , spReturnCode , rowsCount , spResult , ] = SPResult;

  const ExecResults: ExecResults = [returnCode , spReturnCode , rowsCount , spResult ];
  return ExecResults;

}