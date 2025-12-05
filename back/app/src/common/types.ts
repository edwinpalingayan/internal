//==============================================================================
// 型
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
//==============================================================================
"use strict";
import { TYPES } from 'tedious';

// SQLパラメータ
export interface SqlParam {
  name  : string;
  type  : typeof TYPES[keyof typeof TYPES];
  value : any;
}

// レスポンスボディ
export interface ResponseEnvelope {
  name  : string;
  count : number;
  data  : any;
}

// レスポンス用のメッセージ
export interface ResMessage {
  message_code   : string;
  message        : string;
  message_detail : string;
}

// 実行結果
export type ExecResults = [
  number, 
  string,
  number, 
  { [key: string]: any; }
];

// クエリ実行結果
export interface QueryResult {
  rowsCount : number;
  rows      : { [key: string]: any }[];
}

// SQL実行結果
type SqlResult = [
  number, 
  { [key: string]: any; }[]
];

// SQL実行結果
export type Result = [
  number, 
  SqlResult
];

// SQL実行結果（複数）
export type Results = [
  number, 
  SqlResult[]
];




