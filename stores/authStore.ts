import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { isLoading } from "expo-font";
import { jwtDecode } from "jwt-decode";
import axios, { Axios } from "axios";
import { API_BASE } from "@/constants";


interface AuthState {
    accessToken: string | null,
    refreshToken: string | null,
    user: { id: string; email: string; profile?: { name?: string } } | null;
    isloading: boolean;
    setTokens: (access: string, refresh: string) => Promise<void>;
    setUser: (user: AuthState['user']) => void;
    logout: () => Promise<void>;
    setloading: (loading: boolean) => void;
}


export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    refreshToken: null,
    user: null,
    isloading: true,
    setTokens: async (access, refresh) => {
        await SecureStore.setItemAsync("accessToken", access),
            await SecureStore.setItemAsync("refreshToken", refresh),
            set({ accessToken: access, refreshToken: refresh })
    },

    setUser: (user) => set({ user }),
    logout: async () => {
        await SecureStore.deleteItemAsync("accessToken"),
            await SecureStore.deleteItemAsync("refreshToken"),
            set({ accessToken: null, refreshToken: null, user: null })
    },
    setloading: (loading) => set({ isloading: loading })
}));



export const loadTokens = async () => {
    useAuthStore.getState().setloading(true);

    try {
        const access = await SecureStore.getItemAsync("accessToken");
        const refresh = await SecureStore.getItemAsync("refreshToken");

        if (access && refresh) {
            const decoded = jwtDecode<{ exp: number }>(access);
            const isExpired = decoded.exp * 1000 < Date.now();

            if (!isExpired) {
                useAuthStore.getState().setTokens(access, refresh);
            }


            if (isExpired) {
                try {
                    const response = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: refresh });
                    const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
                    await useAuthStore.getState().setTokens(newAccess, newRefresh);

                }
                catch (refreshErr) {
                    console.log("Refresh Failed", refreshErr);
                    await useAuthStore.getState().logout();
                }
                }
                else{
                    useAuthStore.getState().setTokens(access,refresh);
            }
        }
    }


    catch (err) {
        console.error("Load tokens error", err);
    } finally {
        useAuthStore.getState().setloading(false);
    }
};
