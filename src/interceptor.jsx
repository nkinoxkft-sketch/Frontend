import axios from 'axios';

export const api = axios.create({
  baseURL: '/api', 
  withCredentials: true 
});

let currentAccessToken = null;
let onUnauthorizedCallback = null; 

export const setOnUnauthorized = (callback) => {
  onUnauthorizedCallback = callback;
};

export const setAccessToken = (token) => {
  currentAccessToken = token;
};


export const getAccessToken = () => {
  return currentAccessToken
};

export const isAccessToken = () =>{

  if(currentAccessToken !== null){
    return true
  }
  return false
}


api.interceptors.request.use((config) => {
      
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true; 

      try {
  
        const response = await axios.post('/api/auth/refresh', {}, {
          withCredentials: true 
        });

        const newAccessToken = response.data.accessToken;
        setAccessToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {

        setAccessToken(null);

        localStorage.setItem('IsLogedin', 'false');

        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);