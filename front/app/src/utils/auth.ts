import CryptoJS from "crypto-js";
import { API_SECRET_KEY, API_APP_KEY } from "./config";

export function generateBearerToken(): string {
  try {
    // 今日の日付をyyyyMMdd形式で取得
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateString = `${year}${month}${day}`;

    console.log("Date:", dateString);

    // 環境変数から値を取得
    const secretKey = API_SECRET_KEY;
    const appPrefix = API_APP_KEY;

    if (!secretKey || !appPrefix) {
      throw new Error(
        "Environment variables SECRET_KEY and APP_KEY are required",
      );
    }

    // HMAC-SHA256でハッシュを生成
    const hash = CryptoJS.HmacSHA256(dateString, secretKey);
    const hashString = hash.toString(CryptoJS.enc.Hex);

    console.log("Hash:", hashString);

    // プレフィックスを追加
    const prefixedHash = `${appPrefix},${hashString}`;

    console.log("Prefixed:", prefixedHash);

    // Base64エンコード
    const base64String = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(prefixedHash),
    );

    console.log("=== FINAL RESULT ===");
    console.log(base64String);

    return base64String;
  } catch (error) {
    console.error("Bearer token generation failed:", error);
    throw error;
  }
}
