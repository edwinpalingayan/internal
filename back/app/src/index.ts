//==============================================================================
// メイン処理
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
//==============================================================================
"use strict";
import dotenv                                   from "dotenv";
dotenv.config();
import express                                  from "express";
import helmet                                   from "helmet";
import { LOGGER }                               from "./common/log";
import { send }                                 from "./common/sendResponse";
import { RES_STS, ERR_MSG, PORT }               from "./common/const";
import { allRequestHandler, postMethodHandler } from "./common/requestHandler";
const app = express();
app.set("trust proxy", 1);
app.use(helmet());

// 共通処理
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.charset = 'utf-8';
    res.removeHeader("X-Powered-By");
    res.type("application/json; charset=utf-8");
    res.setHeader("X-Process-Start-Time",process.hrtime.bigint().toString());
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Cookie");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    // URLに不正な文字が無いかチェック
    decodeURIComponent(req.path);
  } catch (err){
    LOGGER.warn(`Redirected to root URL because an invalid URL was requested. [URL: ${req.path}]`);
    return res.redirect(`http://${req.get("Host")}`);
  }
  next();
});

// リクエストボディのJSONを取得
app.use(express.json());
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
      LOGGER.error("Error occurred. Invalid JSON.");
      const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.INVALID_JSON);
      send(res,RES_STS.BAD_REQUEST,"ERROR", 1,resDataError,res.get("X-Process-Start-Time")!);
      return;
  }
  next();
});

// OPTIONSリクエスト（プリフライト）の処理
app.options("/*", (req: express.Request, res: express.Response) => {
  res.status(200).end();
});

// ルーティング
app.route("/*")
  .all(allRequestHandler)
  .get(postMethodHandler)
  .post(postMethodHandler)
;

// 待ち受け開始
app.listen(PORT, () => {
  LOGGER.addContext("traceId", "");
  LOGGER.info(`Node.js express is started. [Exec env: ${process.env.ENV} Listening port: ${PORT}]`);
});

