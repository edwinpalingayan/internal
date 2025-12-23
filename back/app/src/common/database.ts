//==============================================================================
// データベース処理
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
// 2025-12-02 iwamura ストアドの実行を追加
//==============================================================================
"use strict";
import { Connection, Request, TYPES }             from 'tedious';
import { RTN_CODE, ERR_MSG, DB_CONFIG }           from "./const";
import { SqlParam, QueryResult, Result, Results, StoredProcParam,StoredProcResult } from "./types";
import { LOGGER }                                 from "./log";

// クエリ実行
async function runQuery(con: Connection, sql: string, prm: { name: string, type: any, value: any }[]): Promise<QueryResult> {
  LOGGER.info(`SQL: ${sql.replace(/\r?\n/g, " ")}`);
  prm && LOGGER.info(`PRM: ${prm.map((prm, ind) => `[${ind}] name: ${prm.name} type: ${prm.type.name} value: ${prm.value} `).join(',')}`);
  return new Promise<QueryResult>((resolve, reject) => {
    let errorMessage: Error | null = null;
    let rowsCount = 0
    const rows: {[key: string]: any}[] = [];
    const req = new Request(sql, () => {});
    req.on('row', (columns: {[key: string]: any}) => {
      const rowData: {[key: string]: any} = {};
      Object.keys(columns).forEach((colName) => rowData[columns[colName].metadata.colName] = columns[colName].value);
      rows.push(rowData);
    });
    req.on("doneInProc", (count) => {typeof count !== "undefined" && (rowsCount = count);LOGGER.debug(`CNT: ${rowsCount}`);});
    req.on('requestCompleted', () => errorMessage ? reject(errorMessage) : resolve({rowsCount,rows}));
    req.on("error", (err: Error) => { LOGGER.error(`SQL execution error. Error on Request. : ${err.message}`); reject(err); });
    if(!con.listeners('errorMessage').length){
      con.on("errorMessage", (err: Error) => { LOGGER.error(`SQL execution error. ErrorMessage on Connection. : ${err.message}`); errorMessage = err;});
    }else{
      con.on("errorMessage", (err: Error) => { errorMessage = err;});
    }
    if(!con.listeners('error').length){
      con.on("error",(err: Error) => {LOGGER.error(`SQL execution error. Error on Connection. : ${err.message}`); errorMessage = err;});
    }else{
      con.on("error", (err: Error) => { errorMessage = err;});
    }
    prm && prm.forEach(prm => req.addParameter(prm.name, prm.type, prm.value));
    con.execSql(req);
  });
}

// ストアド実行
async function callStoredProcedure(con: Connection, procName: string, prm: StoredProcParam[]): Promise<StoredProcResult> {
  LOGGER.info(`SP: ${procName}`);
   prm && LOGGER.info(`PRM: ${prm.map((prm, ind) =>
           `[${ind}] name: ${prm.name} type: ${prm.type.name} value: ${prm.value} output: ${!!prm.isOutput} length: ${prm.length ?? ''}
          }`
       ).join(',')}`);
  const spResult = await new Promise<StoredProcResult>((resolve, reject) => {
    let finalError: Error | null = null;
    let procResultCode = 0;
    let rowsCount = 0;
    const rows: { [key: string]: any }[] = [];
    const outputParameters: Record<string, any> = {};

    // リクエストを作成 (ストアドプロシージャ名を渡す)
    const req = new Request(procName, (err, rowCount) => {
        // // リクエスト完了コールバック
        if (finalError) return reject(finalError);
        if (err) return reject(err);

        // 成功時の結果を構築
          resolve({
            returnCode: RTN_CODE.OK,
            procResultCode: RTN_CODE.OK,
            rowsCount: rowsCount,
            recordset: rows,
            outputParameters: outputParameters,
        });
    });
    
    // --- パラメータの設定 ---
    for (const p of prm) {
        const paramValue = p.value === undefined ? null : p.value;
        if (p.isOutput) {
            req.addOutputParameter(p.name, p.type, paramValue, p.length ? { length: p.length } : undefined); // OUTPUT/RETURN VALUE
        } else {
            req.addParameter(p.name, p.type, paramValue, p.length ? { length: p.length } : undefined); // INPUT
        }
    }

    // --- イベントリスナーの設定 ---
    // SELECT結果セットの行取得
    req.once('row', (columns: { [key: string]: any }) => {
        const rowData: { [key: string]: any } = {};
        Object.keys(columns).forEach((colName) => rowData[columns[colName].metadata.colName] = columns[colName].value);
        rows.push(rowData);
    });

    // OUTPUTの取得
    req.once('returnValue', (paramName, value, metadata) => {
        // ストアドプロシージャから返された OUTPUTを格納
        outputParameters[paramName] = value;
     });

    // エラー処理 (Connection/Request の両方で処理)
    req.once("error", (err: Error) => { LOGGER.error(`SP execution error. Error on Request. : ${err.message}`); finalError = err; });

    if (!con!.listeners('errorMessage').length) {
        con!.on("errorMessage", (err: Error) => { LOGGER.error(`SP execution error. ErrorMessage on Connection. : ${err.message}`); finalError = err; });
    } else {
        con!.on("errorMessage", (err: Error) => { finalError = err; });
    }
    if (!con!.listeners('error').length) {
        con!.on("error", (err: Error) => { LOGGER.error(`SP execution error. Error on Connection. : ${err.message}`); finalError = err; });
    } else {
        con!.on("error", (err: Error) => { finalError = err; });
    }

    // --- ストアドプロシージャの実行 ---
    con.callProcedure(req);
  });

  return spResult;
}

//データベース切断
async function dbClose(con: Connection): Promise<void>{
  return new Promise<void>((resolve, reject) => {
    if (con && !con.closed) {
      con.on('end',   ()    => {LOGGER.debug('Connection closed successfully.');resolve();});
      con.on('error', (err) => {LOGGER.error('Error while closing connection:', err);reject(err);});
      con.close();
    } else {
      LOGGER.debug('Connection is already closed.');
      resolve();
    }
  });
}

//データベース接続
async function dbConnect(): Promise<Connection> {
  const con = new Connection(DB_CONFIG);
  return new Promise<Connection>((resolve, reject) => {
      con.on("connect", (err: Error | null | undefined) => {
        if (err){
          LOGGER.error(`Database connection established error. : ${err}`);
          reject(err);
        }
        LOGGER.debug("Database connection established.");
        resolve(con);
      });
      con.connect();
    }
  );
}

// SQL実行
export async function execQuery(sql: string, prm: SqlParam[]): Promise<Result>{
  let con = null;
  try {
    con = await dbConnect();
    const queryResult: QueryResult = await runQuery(con, sql, prm);
    return [RTN_CODE.OK,[queryResult.rowsCount, queryResult.rows]];
  } catch (err){
    LOGGER.error(`Error occurred. [Function: ${execQuery.name}]`);
    const resDataError = Object.assign({},ERR_MSG.INTERNAL_SERVER_ERROR_DB);
    resDataError.message_detail = resDataError.message_detail;
    return [RTN_CODE.NG,[1, [resDataError]]];
  } finally {
    con && !con.closed && await dbClose(con);
  }
};

// トランザクション内で複数のSQLを実行
export async function execQueries(queries: { sql: string, prm: any[] }[]): Promise<Results>{
  let con:any = null;
  try{
    con = await dbConnect();
    let count: number = 0;
    try {
      await new Promise<void>((resolve, reject) => con.beginTransaction((err:Error) => err ? reject(err) : resolve()));
      const queries2: { sql: string, prm: any[] }[] = [];
      for (const {sql, prm} of queries) {
        const sqlPrm2: SqlParam[] = [];
        for (const param of prm) {
          const type = (param.type.id === TYPES.VarChar.id && param.type.name === TYPES.VarChar.name) ? TYPES.VarChar : TYPES.Int;
          sqlPrm2.push({
            name: param.name,
            type: type,
            value: param.value
           });
        }
        queries2.push({
          sql: sql,
          prm: sqlPrm2
        });
      }
      for (const {sql, prm} of queries2) {
        const queryResult: QueryResult = await runQuery(con, sql, prm);
        count += queryResult.rowsCount;
      }
      await new Promise<void>((resolve, reject) => {con.commitTransaction((err:Error) => err ? reject(err) : resolve());}); 
      LOGGER.debug("Commit Ended.");
    } catch(err) {
      LOGGER.error(`An error occurred during database processing. Performing rollback.`);
      try{
        await new Promise<void>((resolve, reject) => con.rollbackTransaction((err:Error) => err ? reject(err) : resolve()));
        LOGGER.debug("Rollback Ended.");
      }catch(rollbackErr){
        LOGGER.error(`Rollback failed. error: ${JSON.stringify(rollbackErr)}`);
      }
      throw err;
    }
    return [RTN_CODE.OK,[[count, []]]];
  }catch{
    LOGGER.error(`Error occurred. [Function: ${execQueries.name}]`);
    const resDataError = Object.assign({},ERR_MSG.INTERNAL_SERVER_ERROR_DB);
    resDataError.message_detail = resDataError.message_detail;
    return [RTN_CODE.NG,[[1, [resDataError]]]];
  } finally {
    con && !con.closed && await dbClose(con);
  }
}

//ストアドを実行
export async function execStoredProcedure(StoredProcName: string, prm: StoredProcParam[]): Promise<StoredProcResult> {
  let con:any = null;
  let request: Request | null = null;
  let finalError: Error | null = null;

  // --- 実行結果を格納するオブジェクト ---
  let result: StoredProcResult = {
    returnCode: RTN_CODE.OK,
    procResultCode: RTN_CODE.OK,
    rowsCount: 0,
    recordset: [],
    outputParameters: {},
};
  try {
    con = await dbConnect();
    const result = await callStoredProcedure(con,StoredProcName,prm);
    return result;

  } catch (err){
    LOGGER.error(`Error occurred. [Function: ${execStoredProcedure.name}]`);
    const resDataError = Object.assign({},ERR_MSG.INTERNAL_SERVER_ERROR_DB);
    resDataError.message_detail = resDataError.message_detail;
    result.returnCode = RTN_CODE.NG;
    return result;
  } finally {
    con && !con.closed && await dbClose(con);
  }
};