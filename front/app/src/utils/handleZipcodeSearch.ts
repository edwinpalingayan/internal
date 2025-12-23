import * as React from "react";

export type AddressFields = {
  address1: string;
  address2: string;
  address3?: string | undefined;
  [key: string]: string | undefined;
};

export type HandleZipcodeSearchParams = {
  postalCode: string;
  setZipError: React.Dispatch<React.SetStateAction<string | null>>;
  setIsZipLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setFields: React.Dispatch<React.SetStateAction<AddressFields>>;
  validation: Record<string, string>;
};

/**
 * 日本の郵便番号を検索し、住所フィールドを更新するユーティリティ関数です。
 * 使用例: UserInfoForm.tsx を参照してください。
 */
export const handleZipcodeSearch = async ({
  postalCode,
  setZipError,
  setIsZipLoading,
  setFields,
  validation,
}: HandleZipcodeSearchParams) => {
  setZipError(null);
  // 郵便番号が無効な場合は、エラーを設定し住所フィールドをクリアします
  if (!postalCode || !/^\d{3}-?\d{4}$/.test(postalCode)) {
    setZipError("正しい郵便番号を入力してください");
    setFields((f: AddressFields) => ({
      ...f,
      address1: "",
      address2: "",
      address3: "",
    }));
    return;
  } else if (validation.postalCode) {
    setZipError(null);
    setFields((f: AddressFields) => ({
      ...f,
      address1: "",
      address2: "",
      address3: "",
    }));
    return;
  }
  setIsZipLoading(true);
  try {
    // 郵便番号APIを使用して住所を取得
    const response = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`,
    );
    const data = await response.json();
    const result = data.results && data.results[0];

    if (result) {
      setFields((f: AddressFields) => ({
        ...f,
        address1: [result.address1, result.address2].filter(Boolean).join(""),
        address2: result.address3 || "",
        address3: "",
      }));
    } else {
      setZipError("該当する住所が見つかりませんでした");
      setFields((f: AddressFields) => ({
        ...f,
        address1: "",
        address2: "",
        address3: "",
      }));
    }
  } catch {
    setZipError("住所検索に失敗しました");
    setFields((f: AddressFields) => ({
      ...f,
      address1: "",
      address2: "",
      address3: "",
    }));
  } finally {
    setIsZipLoading(false);
  }
};
