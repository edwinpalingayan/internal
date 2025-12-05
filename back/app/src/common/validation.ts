//==============================================================================
// パラメータチェック
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
//==============================================================================
"use strict";
import { parseISO, isValid }        from 'date-fns';
import { ERR_MSG, ISO_DATE_FORMAT } from "./const";
import { ResMessage }               from "./types";
import { z }                        from "zod";


// zodでパラメータをチェック
export async function validateZodKeys<T>(result: ReturnType<z.ZodType<T>['safeParse']>): Promise<ResMessage | null> {
  if (!result.success) {
    const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.INVALID_PARAM);
    const errorMessages = result.error.issues.map(issue => issue.message);
    resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g, errorMessages.join(", "));
    return resDataError;
  }
  return null;
}

// 不要なパラメータをチェック
export async function validateExtraKeys(req: {[key: string]: any}, allowedKeys: string[]): Promise<ResMessage | null> {
  const extraKeys = Object.keys(req).filter(key => !(allowedKeys).includes(key));
  if (extraKeys.length > 0) {
    const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.UNDEFINED);
    resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g, extraKeys.join(", "));
    return resDataError;
  }
  return null;
}

// 必須チェック
export async function validateRequiredKeys(req: {[key: string]: any}, keys: string[]): Promise<ResMessage | null> {
  const invalidKeys: string[] = [];
  for (const key of keys) {
    if (req[key] === undefined || req[key] === null) {
      invalidKeys.push(key);
    }
  }
  if (invalidKeys.length > 0) {
    const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.NOT_SPECIFIED);
    resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g, invalidKeys.join(", "));
    return resDataError;
  }
  return null;
}

// 型チェック
export async function validateKeyTypes(req: {[key: string]: any}, checks:[string, string][]): Promise<ResMessage | null> {
  const invalidKeys: string[] = [];
  const invalidTypes: string[] = [];
  const validTypes: string[] = [];
  for (const [key, type] of checks){
    if (typeof req[key] !== type){
      invalidKeys.push(key);
      invalidTypes.push(type);
      validTypes.push(typeof req[key]);
    }
  }
  if (invalidKeys.length > 0) {
    const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.TYPE_INVALID);
    resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g, invalidKeys.join(", ")).replace(/\{2\}/g, invalidTypes.join(", ")).replace(/\{3\}/g, validTypes.join(", "));
    return resDataError;
  }
  return null;
}

// サイズチェック（string型）
export async function validateKeySizes(req: {[key: string]: any}, checks:[string, number][]): Promise<ResMessage | null> {
  const invalidKeys: string[] = [];
  const invalidSizes: string[] = [];
  const validSizes: string[] = [];
  for (const [key, size] of checks){
    if (new Blob([req[key]]).size > size) {
      invalidKeys.push(key);
      invalidSizes.push(new Blob([req[key]]).size.toString());
      validSizes.push(size.toString());
    }
    if (invalidKeys.length > 0) {
      const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.SIZE_INVALID);
      resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g, invalidKeys.join(", ")).replace(/\{2\}/g, validSizes.join(", ")).replace(/\{3\}/g,invalidSizes.join(", "));
      return resDataError;
    }
  }
  return null;
}
// サイズチェック（Int型）
export async function validateIntRange(req: {[key: string]: any}, keys: string[]): Promise<ResMessage | null> {
  const MIN_INT = -2147483648;
  const MAX_INT =  2147483647;
  const invalidKeys: string[] = [];
  const invalidValues: string[] = [];
  for (const key of keys) {
    if (!Number.isInteger(req[key]) || req[key] < MIN_INT || req[key] > MAX_INT) {
      invalidKeys.push(key);
      invalidValues.push(new Blob([req[key]]).toString());
    }
    if (invalidKeys.length > 0) {
      const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.VALUE_INVALID);
      resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g, invalidKeys.join(", ")).replace(/\{2\}/g, invalidValues.join(", "));
      return resDataError;
    }
  }
  return null;
}

// 日付形式チェック
export async function validateDateTimeFormatAndRange(req: {[key: string]: any}, keys: string[]): Promise<ResMessage | null> {
  const invalidKeys: string[] = [];
  for (const key of keys) {
    let date;
    // 日付型かチェック
    try{
      date = parseISO(req[key]);
    }catch(error){
      const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.DATE_TYPE_INVALID);
      resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g,key).replace(/\{2\}/g,"文字列").replace(/\{3\}/g,typeof req[key]);
      return resDataError;
    }
    // 日付形式（ISO 8601形式）かチェック
    if (!ISO_DATE_FORMAT.test(req[key])){
      const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.DATE_TYPE_INVALID);
      resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g,key).replace(/\{2\}/g,"YYYY-MM-DDTHH:mm:ss.SSSZ").replace(/\{3\}/g, req[key]);
      return resDataError;
    }
    // 有効な日付かチェック（13月や32日など）
    if (!isValid(date)) {
      const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.VALUE_INVALID);
      resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g, key).replace(/\{2\}/g,req[key]);
      return resDataError;
    }
    // datetime型の範囲 (1753年～9999年) 内かチェック
    const year = date.getFullYear();
    if (year < 1753 || year > 9999) {
      const resDataError = Object.assign({},ERR_MSG.QUERY_STRING.VALUE_INVALID);
      resDataError.message_detail = resDataError.message_detail.replace(/\{1\}/g, key).replace(/\{2\}/g,req[key]);
      return resDataError;
    }
  }
  return null;
}
