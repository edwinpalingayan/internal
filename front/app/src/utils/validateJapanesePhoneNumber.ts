export function isValidJapanesePhoneNumber(phoneNumber: string): boolean {
  // ハイフン、スペース、括弧を削除して統一します
  const normalized = phoneNumber.replace(/[-\s()]/g, '');

  // 一般的な国際電話番号形式（E.164）："+"で始まり、8〜15桁の数字が続く
  if (/^\+\d{8,15}$/.test(normalized)) {
    // 日本の番号（+81）の特別な処理
    if (/^\+81\d{9,10}$/.test(normalized)) {
      const afterCountryCode = normalized.substring(3);
      if (!afterCountryCode.startsWith('0')) {
        // Mobile: +8190xxxxxxxx, +8180xxxxxxxx, +8170xxxxxxxx
        if (
          /^90\d{8}$/.test(afterCountryCode) ||
          /^80\d{8}$/.test(afterCountryCode) ||
          /^70\d{8}$/.test(afterCountryCode)
        ) {
          return true;
        }
        // フリーダイヤル: +81120xxxxxx
        if (/^120\d{6}$/.test(afterCountryCode)) {
          return true;
        }
        // 固定電話: 市外局番1〜4桁 + 加入者番号6〜8桁
        if (/^\d{1,4}\d{6,8}$/.test(afterCountryCode)) {
          for (let areaLen = 1; areaLen <= 4; areaLen++) {
            const areaCode = afterCountryCode.slice(0, areaLen);
            const subscriber = afterCountryCode.slice(areaLen);
            if (
              areaCode.length >= 1 &&
              areaCode.length <= 4 &&
              subscriber.length >= 6 &&
              subscriber.length <= 8
            ) {
              return true;
            }
          }
        }
      }
      return false;
    }
    // その他の国の一般的な国際電話番号
    return true;
  }

  // 日本国内形式
  if (/^0\d+$/.test(normalized)) {
    if (!(normalized.length === 10 || normalized.length === 11)) return false;
    if (/^0[789]0\d{8}$/.test(normalized)) return true;
    if (/^0120\d{6}$/.test(normalized)) return true;
    if (/^0\d{1,4}\d{6,8}$/.test(normalized)) {
      for (let areaLen = 2; areaLen <= 4; areaLen++) {
        const areaCode = normalized.slice(0, areaLen);
        const subscriber = normalized.slice(areaLen);
        if (
          areaCode.length >= 2 &&
          areaCode.length <= 4 &&
          subscriber.length >= 6 &&
          subscriber.length <= 8
        ) {
          return true;
        }
      }
    }
  }

  return false;
}
