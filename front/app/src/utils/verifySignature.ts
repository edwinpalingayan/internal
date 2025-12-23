// =============================================================================
// デジタル署名検証処理
// =============================================================================
// 変更履歴
// 2024-09-02 H.Miyashita 新規作成
// =============================================================================

//import { RSA_PUBLIC_KEY } from "../utils/config";
export interface PublicKeyJwk {
  kty: string;
  e: string;
  n: string;
  alg?: string;
  ext?: boolean;
  key_ops?: string[];
  [key: string]: unknown;
}

export async function verifySignature(
  data: unknown,
  signature: string,
  publicKeyJwk: PublicKeyJwk,
): Promise<boolean> {
  //RSA_PUBLIC_KEY
  try {
    // JWKから公開鍵を生成
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      publicKeyJwk,
      {
        name: "RSA-PSS",
        hash: { name: "SHA-256" },
      },
      false,
      ["verify"],
    );

    // データをArrayBufferに変換
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    // Base64エンコードされた署名をArrayBufferに変換
    const signatureBuffer = Uint8Array.from(atob(signature), (c) =>
      c.charCodeAt(0),
    );

    // 署名を検証
    const isValid = await window.crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32, // サーバー側の設定に合わせて調整が必要
      },
      publicKey,
      signatureBuffer,
      dataBuffer,
    );

    return isValid;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}
