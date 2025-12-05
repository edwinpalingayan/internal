//==============================================================================
// 申込・申込詳細データ追加（SCHOOLDB）
//------------------------------------------------------------------------------
// 変更履歴
// 2025-09-16 iwamura 新規作成
//==============================================================================
"use strict";
import { Request }               from "express";
import { TYPES }                 from "tedious";
import { RES_STS }               from "../../../common/const";
import { SqlParam, ExecResults } from "../../../common/types";
import { sqlTrnExecutor }        from "../../../common/sqlExecutor"
import { validateExtraKeys, validateRequiredKeys, validateKeyTypes, validateKeySizes } from "../../../common/validation";

// SQL
const sqlTemplate = `
EXECUTE SP_INSERT_SCHOOLDB_TT_MOSHIKOMI 
		  @EVENT_ID
		, @GMS_KOKYAKU_ID
		, @KOSHIN_ID
;`;

// SQLパラメータ
const sqlPrm: SqlParam[]   = [
  {name : "EVENT_ID"        , type : TYPES.VarChar , value : null},
  {name : "GMS_KOKYAKU_ID"  , type : TYPES.VarChar , value : null},
  {name : "KOSHIN_ID"       , type : TYPES.VarChar , value : null}
];

// リクエストパラメータ
interface ReqParam {
  event_id        : string;
  gms_kokyaku_id  : string;
  koshin_id       : string;
}
const allowedParam: (keyof ReqParam)[] = [
  "event_id",
  "gms_kokyaku_id",
  "koshin_id"
];

export async function post_school_tt_moshikomi(req: Request): Promise<ExecResults> {
  const reqParams: ReqParam[] = req.body; 
  const queries: { sql: string, prm: any[] }[] = [];
  let result;
  let sqlStr = sqlTemplate;

  for (const reqParam of reqParams) {
  
    // 不要なパラメータをチェック
    result = await validateExtraKeys(reqParam, allowedParam);
    if (result) return [RES_STS.BAD_REQUEST,"error", 1,result];

    // 必須パラメータチェック
    result = await validateRequiredKeys(reqParam, [ "event_id", "gms_kokyaku_id", "koshin_id"]);
    if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];

    // 型チェック
    result = await validateKeyTypes(reqParam, [["event_id","string"],["gms_kokyaku_id","string"],["koshin_id","string"]]);
    if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];

    // サイズチェック
    result = await validateKeySizes(reqParam, [["event_id",12],["gms_kokyaku_id",10],["koshin_id",30]]);
    if (result) return [RES_STS.BAD_REQUEST,"ERROR",1,result];

    // パラメータ設定
    sqlPrm.forEach(prm => {
      const key = prm.name.toLowerCase() as keyof ReqParam;
      prm.value = (key in reqParam) ? reqParam[key] ?? null : prm.value
    });

    // SQL設定
    queries.push({sql: sqlStr, prm: JSON.parse(JSON.stringify(sqlPrm))});
  };

  // SQL実行
  return await sqlTrnExecutor(post_school_tt_moshikomi.name,queries) as ExecResults;

}