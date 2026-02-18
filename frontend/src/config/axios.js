import axios from "axios";

// Set base URL based on environment
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Configure axios defaults
axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = true;

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized errors
      console.error("Unauthorized access - please login");
    }
    return Promise.reject(error);
  },
);

export default axios;
