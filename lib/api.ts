// import axios from 'axios';

// const isServer = typeof window === 'undefined';
// const baseURL = isServer
// 	? (process.env.BACKEND_API_URL)
// 	: (process.env.NEXT_PUBLIC_BACKEND_API_URL);

// 	console.log("baseURL", baseURL, process.env.BACKEND_API_URL, process.env.NEXT_PUBLIC_BACKEND_API_URL, isServer);
// const api = axios.create({
// 	baseURL,
// 	headers: {
// 		'Content-Type': 'application/json',
// 	},
// 	withCredentials: true,
// });



// // Response interceptor for error handling
// api.interceptors.response.use(
// 	(response) => response,
// 	(error) => {
// 		if (error.response) {
// 			// Skip logging for expected errors (401 Unauthorized)
// 			const isExpectedError = error.response.status === 401;

// 			if (!isExpectedError) {
// 				// Log the error message from the backend
// 				// Only log if it's JSON, not HTML
// 				const contentType = error.response.headers['content-type'];
// 				if (contentType && contentType.includes('application/json')) {
// 					// Add more context to the error log
// 					const errorData = error.response.data;
// 					const isEmpty = Object.keys(errorData || {}).length === 0;

// 					if (isEmpty) {
// 						console.error('API Error: Empty response body. Status:', error.response.status, 'URL:', error.config?.url);
// 					} else {
// 						console.error('API Error:', errorData);
// 					}
// 				} else if (contentType && contentType.includes('text/html')) {
// 					console.error('API Error: Received HTML response (likely 404 or server error). Status:', error.response.status, 'URL:', error.config?.url);
// 				} else {
// 					console.error('API Error:', error.response.status, error.response.statusText, 'URL:', error.config?.url);
// 				}
// 			}
// 		}
// 		return Promise.reject(error);
// 	}
// );

// export default api;



import axios from "axios";

const isServer = typeof window === "undefined";

const baseURL = isServer
  ? process.env.BACKEND_API_URL
  : process.env.NEXT_PUBLIC_BACKEND_API_URL;

console.log(
  "baseURL",
  baseURL,
  process.env.BACKEND_API_URL,
  process.env.NEXT_PUBLIC_BACKEND_API_URL,
  isServer
);

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const fullURL = `${config.baseURL ?? ""}${config.url ?? ""}`;
  console.log("FINAL REQUEST URL:", fullURL);
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error:", error.response.status, error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default api;