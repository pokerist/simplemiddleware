export interface HikCentralRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string; // e.g. /artemis/api/resource/v1/person/single/add
  payload?: any;
  headers?: Record<string, string>;
}

export interface ExecuteRequest {
  endpoint: string;
  payload?: any;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // Optional, default to POST or GET based on payload? User said POST /api/execute request body has endpoint and payload.
}

export interface HikCentralResponse<T = any> {
  code: string;
  msg: string;
  data: T;
}
