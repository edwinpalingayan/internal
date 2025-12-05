// =============================================================================
// 認証情報作成処理
// =============================================================================
// 変更履歴
// 2024-09-02 H.Miyashita 新規作成
// =============================================================================
import dayjs from 'dayjs';
import ja from 'dayjs/locale/ja';
import CryptoJS from 'crypto-js';
dayjs.locale(ja);

export interface CreateBearerTokenParams {
  secretKey: string;
  appKey: string;
}

export function createBearerToken(secretKey: string, appKey: string): string {
  // 現在日付設定（日本時間）
  const nowDate: string = dayjs().format('YYYYMMDD');

  // ハッシュ化（HMAC-SHA256）
  const hashStr: string = CryptoJS.HmacSHA256(nowDate, secretKey).toString(CryptoJS.enc.Hex);

  // エンコード（Base64）
  const base64Str: string = btoa(appKey + ',' + hashStr);
  return base64Str;
}
