import * as qs from 'qs';
import Axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { CustomWindow } from '..';

export interface AjaxResponse<T> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}
export interface AuthResponse<T> {
  code: number;
  msg: string;
  result: T;
  success: boolean;
}

function handleSuccess(response: AxiosResponse) {
  return response.data;
}

/**
 * 异常处理函数
 * @param error
 */
function handleError(error: AxiosError) {
  const { response, message } = error;
  let errorMsg = '';
  if (response) {
    switch (response.status) {
      case 400:
        errorMsg = response.data ? response.data.message : '';
        break;
      case 500:
      case 501:
      case 502:
        errorMsg = response.data ? response.data.message : '服务器内部错误';
        break;
    }
    return Promise.reject({
      code: response.status,
      success: false,
      data: null,
      message: errorMsg,
    });
  } else if (message === 'cancel') {
    // 频繁操作时会有这个问题
    return Promise.reject({
      code: 50000,
      success: false,
      message,
    });
  }
  return Promise.reject({
    code: 50000,
    success: false,
    message: '对不起，服务出错了',
  });
}

function createFlag(config: AxiosRequestConfig) {
  const { baseURL = '', url = '', method = '', data, params } = config;
  let flag = baseURL + url + '&' + method;
  if (data) {
    flag += `&${data}`;
  }
  if (params) {
    flag += `&${JSON.stringify(params)}`;
  }
  return flag;
}

function removePending(config: AxiosRequestConfig) {
  for (const p in pendingArr) {
    if (pendingArr.hasOwnProperty(p)) {
      const pending = pendingArr[p];
      if (pending.url === createFlag(config)) {
        pending.cancelFn('cancel');
        pendingArr.splice(+p, 1);
      }
    }
  }
}

let pendingArr: { url: string; cancelFn: (message?: string) => void }[] = [];
const CancelToken = Axios.CancelToken;

const axios = Axios.create({
  baseURL: '/',
  // 查询对象序列化函数
  paramsSerializer(params) {
    return qs.stringify(params);
  },
  // 请求后的数据处理
  transformResponse: [
    function(data) {
      return data;
    },
  ],
  responseType: 'json',
  // xsrf 设置
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

axios.interceptors.request.use(
  config => {
    removePending(config);
    config.cancelToken = new CancelToken(cancelFn => {
      pendingArr.push({
        url: createFlag(config),
        cancelFn,
      });
    });
    return config;
  },
  err => {
    return Promise.reject(err);
  },
);

axios.interceptors.response.use(
  response => {
    removePending(response.config);
    return response;
  },
  err => {
    pendingArr = [];
    return Promise.reject(err);
  },
);

function post<T>(url: string, data?: string | object, option?: AxiosRequestConfig): Promise<AjaxResponse<T>> {
  return axios
    .post<T>(url, data, option)
    .then(handleSuccess)
    .catch(handleError);
}

export default {
  get: async function<T>(url: string, data?: object, needLogin = true): Promise<AjaxResponse<T>> {
    if (needLogin && ((window as unknown) as CustomWindow).requestConfig.getToken) {
      const token = await ((window as unknown) as CustomWindow).requestConfig.getToken();
      return axios
        .get<T>(url, {
          headers: {
            'access-token': token,
          },
          withCredentials: false,
          params: data,
        })
        .then(handleSuccess)
        .catch(handleError);
    }
    return axios
      .get<T>(url, {
        params: data,
        withCredentials: ((window as unknown) as CustomWindow).requestConfig
          ? ((window as unknown) as CustomWindow).requestConfig.withCredentials
          : false,
      })
      .then(handleSuccess)
      .catch(handleError);
  },
  put: async function<T>(url: string, data?: object, needLogin = true): Promise<AjaxResponse<T>> {
    if (needLogin && ((window as unknown) as CustomWindow).requestConfig.getToken) {
      const token = await ((window as unknown) as CustomWindow).requestConfig.getToken();
      return axios
        .put<T>(url, data, {
          headers: {
            'access-token': token,
          },
          withCredentials: false,
        })
        .then(handleSuccess)
        .catch(handleError);
    }
    return axios
      .put<T>(url, data, {
        withCredentials: ((window as unknown) as CustomWindow).requestConfig
          ? ((window as unknown) as CustomWindow).requestConfig.withCredentials
          : false,
      })
      .then(handleSuccess)
      .catch(handleError);
  },
  delete: async function<T>(url: string, data?: object, needLogin = true): Promise<AjaxResponse<T>> {
    if (needLogin && ((window as unknown) as CustomWindow).requestConfig.getToken) {
      const token = await ((window as unknown) as CustomWindow).requestConfig.getToken();
      return axios
        .delete<T>(url, {
          headers: {
            'access-token': token,
          },
          withCredentials: false,
          params: data,
        })
        .then(handleSuccess)
        .catch(handleError);
    }
    return axios
      .delete<T>(url, {
        params: data,
        withCredentials: ((window as unknown) as CustomWindow).requestConfig
          ? ((window as unknown) as CustomWindow).requestConfig.withCredentials
          : false,
      })
      .then(handleSuccess)
      .catch(handleError);
  },
  postForm: async function<T>(url: string, data?: object, params?: object, needLogin = true): Promise<AjaxResponse<T>> {
    if (needLogin && ((window as unknown) as CustomWindow).requestConfig.getToken) {
      const token = await ((window as unknown) as CustomWindow).requestConfig.getToken();
      return post<T>(url, qs.stringify(data || {}), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'access-token': token,
        },
        withCredentials: false,
        params,
      });
    }
    return post<T>(url, qs.stringify(data || {}), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params,
      withCredentials: ((window as unknown) as CustomWindow).requestConfig
        ? ((window as unknown) as CustomWindow).requestConfig.withCredentials
        : false,
    });
  },
  postJSON: async function<T>(url: string, data?: object, params?: object, needLogin = true): Promise<AjaxResponse<T>> {
    if (needLogin && ((window as unknown) as CustomWindow).requestConfig.getToken) {
      const token = await ((window as unknown) as CustomWindow).requestConfig.getToken();
      return post<T>(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'access-token': token,
        },
        params,
        withCredentials: false,
      });
    }
    return post<T>(url, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      params,
      withCredentials: ((window as unknown) as CustomWindow).requestConfig
        ? ((window as unknown) as CustomWindow).requestConfig.withCredentials
        : false,
    });
  },
  authGet: function<T>(url: string, data?: object): Promise<AuthResponse<T>> {
    return axios
      .get<T>(url, { params: data })
      .then(handleSuccess)
      .catch(handleError);
  },
  authForm: function<T>(url: string, data?: object): Promise<AuthResponse<T>> {
    return axios
      .post<T>(url, qs.stringify(data || {}), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .then(handleSuccess)
      .catch(handleError);
  },
};

export interface HttpProps {
  get: <T>(url: string, option?: object) => Promise<AjaxResponse<T>>;
  put: <T>(url: string, option?: object) => Promise<AjaxResponse<T>>;
  delete: <T>(url: string, option?: object) => Promise<AjaxResponse<T>>;
  postForm: <T>(url: string, data?: object) => Promise<AjaxResponse<T>>;
  postJSON: <T>(url: string, data?: object) => Promise<AjaxResponse<T>>;
  authGet: <T>(url: string, option?: object) => Promise<AuthResponse<T>>;
  authForm: <T>(url: string, data?: object) => Promise<AuthResponse<T>>;
}
