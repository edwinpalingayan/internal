// =============================================================================
// 設定処理
// =============================================================================
// 変更履歴
// 2024-09-02 H.Miyashita 新規作成
// =============================================================================

export const MODE_ENV =
  import.meta.env.MODE === 'production'
    ? 'PRD' // アプリの実行環境
    : import.meta.env.MODE === 'development'
      ? 'DEV'
      : import.meta.env.MODE === 'sandbox'
        ? 'SND'
        : 'PC';
export const API_SECRET_KEY = import.meta.env[`VITE_${MODE_ENV}_API_SECRET_KEY`]; // BackEndのAPIの認証用のシークレットキー
export const API_APP_KEY = import.meta.env[`VITE_${MODE_ENV}_API_APP_KEY`]; // BackEndのAPIの認証用のアプリキー
export const API_ORIGIN = import.meta.env[`VITE_${MODE_ENV}_API_ORIGIN`]; // BackEndのAPIのURLのORIGIN
export const URL_PREFIX = import.meta.env[`VITE_${MODE_ENV}_URL_PREFIX`]; // SND環境でURLにmit-dを付与する為のプレフィックス
export const FMS_URL = import.meta.env[`VITE_${MODE_ENV}_FMS_URL`]; // 講師管理システムの講師詳細画面のURL
export const API_URL = `${API_ORIGIN}${URL_PREFIX}`; // BackEndのAPIのURLの先頭部分
