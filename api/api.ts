import { API_BASE } from "@/constants";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";

const api = axios.create({
    baseURL: API_BASE,
});

// Attach access token to every request
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// On 401, try refreshing the token once then retry
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refresh = useAuthStore.getState().refreshToken;
            if (!refresh) return Promise.reject(error);
            try {
                const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: refresh });
                await useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return axios(original);
            } catch {
                await useAuthStore.getState().logout();
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default api;