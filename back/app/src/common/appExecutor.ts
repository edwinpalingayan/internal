//==============================================================================
// アプリケーション実行
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
//==============================================================================
"use strict";
import { Request,Response } from "express";
import { existsSync }       from "fs";
import { LOGGER }           from "./log";
import { RES_STS, ERR_MSG } from "./const";
import { ExecResults }      from "./types";

export async function appExecutor(req: Request, res: Response): Promise<ExecResults> {
  try {
    // リクエストパスに対応するモジュールを呼び出す（ローカルで実行する際にビルド前のファイルを読み込む場合があるのでtsも考慮）
    const ext          = existsSync(`./app${req.path}.ts`) ? ".ts" : ".js";
    const loadedModule = await import(`../app${req.path}${ext}`);
    const moduleName   = req.path.split("/")[req.path.split("/").length - 1];
    const handler      = loadedModule?.default?.[moduleName] ?? loadedModule?.[moduleName];
    return await handler(req) as ExecResults;

  } catch (err){
    let errMsg = "";
    if (err instanceof Error) {
      if (err.message.includes("Cannot find module")) {
        // リクエストパスに対応するモジュールが無い場合
        const resDataError = Object.assign({},ERR_MSG.URL_NOT_FOUND);
        resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g,req.path);
        return [RES_STS.URL_NOT_FOUND, "ERROR", 1, resDataError];
      }else{
        LOGGER.error(`Error occurred. [Function: ${appExecutor.name} Message: ${err.stack}]`);
        errMsg = err.toString()
      }
    }else{
      LOGGER.error(`Error occurred. [Function: ${appExecutor.name} Message: ${err}]`);
    }
    const resDataError = Object.assign({},ERR_MSG.INTERNAL_SERVER_ERROR);
    resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g,`Function: ${appExecutor.name}`);
    resDataError.message_detail = resDataError.message_detail.replace(/\{2\}/g,errMsg);
    return [RES_STS.INTERNAL_SERVER_ERROR, "ERROR", 1, resDataError];
  }
}
