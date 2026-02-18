import axios from "axios";

// Set base URL based on environment
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Configure axios defaults
axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = true;

// Add request interceptor to attach Authorization header
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug log for production troubleshooting
    console.log(
      "Request to:",
      config.url,
      "Auth header:",
      config.headers.Authorization ? "Present" : "Missing",
    );

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
      // Optionally clear token and redirect to login
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  },
);

export default axios;
