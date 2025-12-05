//==============================================================================
// ログ
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
//==============================================================================
"use strict";
import { addLayout, configure, getLogger } from "log4js";

addLayout("jstPattern", function() {
  return function(logEvent) {
    const date = new Date(logEvent.startTime);
    const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)).toISOString().replace("Z", "");
    const traceId   = logEvent.context.traceId ? logEvent.context.traceId : "";
    return `${jstDate},[${traceId.padEnd(40, " ")}],[${logEvent.level.levelStr.padEnd(5, " ")}],${logEvent.data}`
  };
});

configure(
  {
    "appenders"  : {"console" : {"type" : "console","layout" : {"type" : "jstPattern"}}},
    "categories" : {"default" : {"appenders" : ["console"],"level" : process.env.LOG || "info"}}
  }
);

export const LOGGER = getLogger("default");