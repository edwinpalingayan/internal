//==============================================================================
// 型
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
// 2025-12-02 iwamura ストアド用の型を追加
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


// 実行結果（ストアド）
export type SPExecResults = [
  number, 
  string,
  number, 
  { [key: string]: any; },
  Record<string, any> // OUTPUTパラメータの名前と値
];

// ストアド実行用のパラメータ
export interface StoredProcParam {
  name: string;
  type: typeof TYPES[keyof typeof TYPES]; 
  value: any; 
  isOutput: boolean;
  length?: number; // NVarCharなどの場合に必要
}

// ストアドのパラメータ
type StoredProcParams = StoredProcParam[];

// ストアド実行結果
export interface StoredProcResult {
  returnCode: number,
  procResultCode: number,
  rowsCount: number,
  recordset: any[], // SELECTで返された結果セット
  outputParameters: Record<string, any> // OUTPUTパラメータの名前と値
}





