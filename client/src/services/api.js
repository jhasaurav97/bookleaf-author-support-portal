import axios from "axios";

export const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach the latest access token to each API request.
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("accessToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshWaiters = [];

function settleRefreshWaiters(error, token = null) {
    refreshWaiters.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });

    refreshWaiters = [];
}

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || "";
        const status = error.response?.status;

        const isAuthEndpoint = [
            "/auth/login",
            "/auth/refresh",
            "/auth/logout",
        ].some((path) => requestUrl.includes(path));

        // Refresh only on 401, and never retry the same request indefinitely.
        if (
            status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            isAuthEndpoint
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        // If another request is already refreshing, wait for its new token.
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshWaiters.push({ resolve, reject });
            }).then((newToken) => {
                originalRequest.headers =
                    originalRequest.headers || {};

                originalRequest.headers.Authorization =
                    `Bearer ${newToken}`;

                return api(originalRequest);
            });
        }

        isRefreshing = true;

        try {
            // Use axios directly so this refresh call doesn't trigger this
            // same response interceptor again.
            const refreshResponse = await axios.post(
                `${api.defaults.baseURL}/auth/refresh`,
                {},
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const newToken =
                refreshResponse.data?.data?.accessToken;

            if (!newToken) {
                throw new Error(
                    "Refresh endpoint did not return an access token."
                );
            }

            sessionStorage.setItem("accessToken", newToken);

            settleRefreshWaiters(null, newToken);

            originalRequest.headers =
                originalRequest.headers || {};

            originalRequest.headers.Authorization =
                `Bearer ${newToken}`;

            // Retry the original API request transparently.
            return api(originalRequest);
        } catch (refreshError) {
            settleRefreshWaiters(refreshError);

            sessionStorage.removeItem("accessToken");

            // Tell AuthContext that the session can no longer be restored.
            window.dispatchEvent(new Event("auth:session-expired"));

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);