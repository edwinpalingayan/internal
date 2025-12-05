import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { generateBearerToken } from '@/utils/auth';
import { API_URL } from '@/utils/config';
const token = generateBearerToken();

const api: AxiosInstance = axios.create({
  // baseURL: '/', // <<--- Use root, so requests go to the Vite dev server
  baseURL: API_URL || '/', //server.js
  timeout: 10000,
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// Generic GET
export const get = async <T>(
  endpoint: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response: AxiosResponse<T> = await api.get(endpoint, { params, ...config });
  return response.data;
};

// Generic POST
export const post = async <T, D = unknown>(
  endpoint: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response: AxiosResponse<T> = await api.post(endpoint, data, config);
  return response.data;
};

/*
  Random User API
  TODO: delete this when not needed
*/
const randomUserApi: AxiosInstance = axios.create({
  baseURL: 'https://randomuser.me',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch random user(s)
export const fetchRandomUser = async (results: number = 1) => {
  const response = await randomUserApi.get(`/api/`, {
    params: { results },
  });
  return response.data;
};
