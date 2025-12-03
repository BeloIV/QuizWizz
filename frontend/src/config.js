// Determine the API base URL based on the hostname
const hostname = window.location.hostname;

let API_BASE_URL;

if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
  // Local development - use local backend
  API_BASE_URL = 'http://192.168.1.250:8080/api';
} else {
  // Production/remote - use tunnel backend
  API_BASE_URL = 'https://quizwizzapi.bytboyzserver.xyz/api';
}

export { API_BASE_URL };