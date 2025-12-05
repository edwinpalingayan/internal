//==============================================================================
// 定数
//------------------------------------------------------------------------------
// 変更履歴
// 2025-04-17 H.Miyashita 新規作成
//==============================================================================
"use strict";
import { ConnectionConfiguration } from 'tedious';

// 環境変数
export const SECRET_KEY        = process.env[`SECRET_KEY_${process.env.ENV}`]!;        // 認証用の文字列をハッシュ化する際の秘密鍵
export const APP_KEY           = process.env[`APP_KEY_${process.env.ENV}`]!;           // 認証情報に設定するアプリのID
export const PORT              = process.env[`PORT_${process.env.ENV}`]!;              // 待ち受けポート
export const ROOT_PATH         = process.env[`ROOT_PATH_${process.env.ENV}`]!;         // ルートパス
export const HEALTH_CHECK_PATH = process.env[`HEALTH_CHECK_PATH_${process.env.ENV}`]!; // ヘルスチェックパス
const DB_SERVER                = process.env[`DB_SERVER_${process.env.ENV}`]!;         // 接続するデータベース
const DB_USER                  = process.env[`DB_USER_${process.env.ENV}`]!;           // データベースに接続する際のユーザー
const DB_PASS                  = process.env[`DB_PASS_${process.env.ENV}`]!;           // データベースに接続する際のパスワード


export const RES_STS = {
    "OK"                       : 200,  //リクエストされた処理が成功
    "BAD_REQUEST"              : 400,  //リクエストされた内容が正しくない
    "UNAUTHORIZED"             : 401,  //リクエストされたアプリの認証に失敗
    "FORBIDDEN"                : 403,  //リクエストされたリソースへのアクセスを許可されていない
    "URL_NOT_FOUND"            : 404,  //リクエストされたリソースを見つけることができない
    "METHOD_NOT_ALLOWED"       : 405,  //リクエストされたメソッドが正しくない
    "UNSUPPORTED_MEDIA_TYPE"   : 415,  //リクエストされたContent-Typeが正しくない
    "INTERNAL_SERVER_ERROR"    : 500   //リクエストの処理中に何らかのエラーが発生
};
export const ERR_MSG = {
    "QUERY_STRING"             : {
      "NOT_SPECIFIED"          : {"message_code" : "400_0001","message" : "指定が必須のパラメータが指定されていません。"        ,"message_detail" : "「{1}」を指定して下さい。"},
      "UNDEFINED"              : {"message_code" : "400_0002","message" : "不要なパラメータが指定されています。"                ,"message_detail" : "「{1}」を削除して下さい。"},
      "DUPLICATED"             : {"message_code" : "400_0003","message" : "同じパラメータが複数回指定されています。"            ,"message_detail" : "「{1}」の指定を1回にして下さい。"},
      "TYPE_INVALID"           : {"message_code" : "400_0004","message" : "パラメータの形式が正しくありません。"                ,"message_detail" : "「{1}」は{2}形式で設定して下さい。「{3}」形式で設定されていました。"},
      "DATE_TYPE_INVALID"      : {"message_code" : "400_0005","message" : "パラメータの日付形式が正しくありません。"            ,"message_detail" : "「{1}」は{2}形式で設定して下さい。「{3}」が設定されていました。"},
      "SIZE_INVALID"           : {"message_code" : "400_0006","message" : "パラメータのサイズが正しくありません。"              ,"message_detail" : "「{1}」は{2}byte以下で設定して下さい。設定値は{3}byteでした。"},
      "VALUE_INVALID"          : {"message_code" : "400_0007","message" : "パラメータの値が有効ではありません。"                ,"message_detail" : "「{1}」の設定値が「{2}」でした。"},
      "INVALID_JSON"           : {"message_code" : "400_0008","message" : "リクエストボディのJSON形式が正しくありません。"      ,"message_detail" : "正しいJSON形式で指定して下さい。"},
      "INVALID_PARAM"          : {"message_code" : "400_0009","message" : "パラメータのチェックでエラーが発生しました。"        ,"message_detail" : "{1}"}
    },
    "AUTHENTICATION"           : {
      "NOT_SPECIFIED"          : {"message_code" : "401_0001","message" : "認証情報が設定されていません。"                      ,"message_detail" : "認証情報を設定して下さい。"},
      "FORMAT_INVALID"         : {"message_code" : "401_0002","message" : "認証情報の形式が正しくありません。"                  ,"message_detail" : "認証情報を正しい形式で設定して下さい。"},
      "BASE64DECODE_ERROR"     : {"message_code" : "401_0003","message" : "認証情報を復号できませんでした。"                    ,"message_detail" : "認証情報を正しい形式で設定して下さい。"},
      "DECODED_STRING_INVALID" : {"message_code" : "401_0004","message" : "認証キーの形式が正しくありません。"                  ,"message_detail" : "認証キーを正しい形式で設定して下さい。"},
      "UNAUTHORIZED"           : {"message_code" : "401_0005","message" : "認証に失敗しました。"                                ,"message_detail" : "正しい認証キーを設定して下さい。"}
    },
    "FORBIDDEN"                : {"message_code" : "403_0001","message" : "リクエストされたURLへの接続は許可されていません。"   ,"message_detail" : "送信元IPアドレス「{1}」は、「{2}」へのアクセスが許可されていません。"},
    "URL_NOT_FOUND"            : {"message_code" : "404_0001","message" : "リクエストされたURLは存在しません。"                 ,"message_detail" : "正しいURLにリクエストを送って下さい。リクエストURLは「{1}」でした。"},
    "METHOD_NOT_ALLOWED"       : {"message_code" : "405_0001","message" : "リクエストされたメソッドは使用できません。"          ,"message_detail" : "正しいメソッドでリクエストを送って下さい。リクエストメソッドは「{1}」でした。"},
    "INTERNAL_SERVER_ERROR"    : {"message_code" : "500_0001","message" : "リクエストの処理中にエラーが発生しました。"          ,"message_detail" : "{1} {2}"},
    "INTERNAL_SERVER_ERROR_DB" : {"message_code" : "500_0002","message" : "リクエストの処理中にエラーが発生しました。"          ,"message_detail" : "データベースの処理でエラーが発生しました。"}
};
export const RTN_CODE          = {"OK" : 0,"NG" : 1};
export const TIME_DIFF_MSEC    = 32400000;
export const ONE_DAY_MSEC      = 86400000;
export const ISO_DATE_FORMAT   = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export const DB_CONFIG: ConnectionConfiguration = {
    "server": DB_SERVER!,
    "authentication": {
        "type": "default",
        "options": {
            "userName": DB_USER!,
            "password": DB_PASS!
        }
    },
    options: {
      "encrypt"                          : true,
      "trustServerCertificate"           : true,
      "rowCollectionOnRequestCompletion" : true,
      "useColumnNames"                   : true
    }
};



