export interface PrivacyPolicyData {
  CONST_CHI: string;
}

export interface GetSchoolUrlPrivacyPolicyResponse {
  name: string;
  count: number;
  data: PrivacyPolicyData[];
}
