//==============================================================================
//ＳＱＬ実行
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
//==============================================================================
"use strict";
import { execQuery,execQueries } from "./database";
import { LOGGER }                from "./log";
import { SqlParam, ExecResults } from "./types";
import { RES_STS }               from "./const";

// SQL実行結果を処理
async function handleSqlResult(name: string, sqlReturnCode: number, rowCount: number, resultArray: { [key: string]: any; }[]): Promise<ExecResults> {
  if (sqlReturnCode){
    LOGGER.error(`Error Message : ${resultArray[0].message_code} ${resultArray[0].message} ${resultArray[0].message_detail}`);
    LOGGER.debug(`Error Data    : ${JSON.stringify(resultArray)}`);  // debug
    return [RES_STS.INTERNAL_SERVER_ERROR, "error", 1, resultArray];
  }
  LOGGER.info (`Rows Returned : ${rowCount}`);
  LOGGER.debug(`Response Data : ${JSON.stringify(resultArray)}`);
  return [RES_STS.OK, name, rowCount, resultArray];
}

// SQL実行
export async function sqlExecutor(name: string, sqlStr: string, sqlPrm: SqlParam[]): Promise<ExecResults> {
  const [sqlReturnCode,[rowCount,resultArray]] = await execQuery(sqlStr,sqlPrm);
  return handleSqlResult(name, sqlReturnCode, rowCount, resultArray);
}

// トランザクション内で複数のSQLを実行
export async function sqlTrnExecutor(name: string, queries: { sql: string, prm: any[] }[]): Promise<ExecResults> {
  const [sqlReturnCode,resultsArray] = await execQueries(queries);
  const rowCount    = resultsArray[0][0];
  const resultArray = resultsArray[0][1];
  return handleSqlResult(name, sqlReturnCode, rowCount, resultArray);
}