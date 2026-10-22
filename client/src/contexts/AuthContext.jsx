import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const restoreSession = async () => {
            const token = sessionStorage.getItem("accessToken");

            if (!token) {
                setIsInitializing(false);
                return;
            }

            try {
                const response = await api.get("/auth/me");
                const currentUser = response.data?.data?.user;
                
                if (!currentUser) {
                    throw new Error("Invalid session response");
                }

                if (!cancelled) {
                    setUser(currentUser);
                }
            } catch (error) {
                if (!cancelled && [401, 403].includes(error.response?.status)) {
                    sessionStorage.removeItem("accessToken");
                }

                if (!cancelled && error.response && ![401, 403].includes(error.response.status)) {
                    console.error("Session restoration failed:", error);
                }
            } finally {
                if (!cancelled) {
                    setIsInitializing(false)
                }
            }
        }

        restoreSession();

        return () => {
            cancelled = true;
        }
    }, []);

    useEffect(() => {
      const handleSessionExpired = () => {
        sessionStorage.removeItem("accessToken");
        setUser(null);
        setIsInitializing(false);
      };

      window.addEventListener("auth:session-expired", handleSessionExpired);

      return () => {
        window.removeEventListener(
          "auth:session-expired",
          handleSessionExpired,
        );
      };
    }, []);

    const login = useCallback(async ({ email, password }) => {
        const response = await api.post("/auth/login", {
            email: email.trim().toLowerCase(),
            password,
        });

        const { user: loggedInUser, accessToken } = response.data?.data ?? {};

        if (!loggedInUser || !accessToken) {
            throw new Error("Login response is incomplete");
        }

        sessionStorage.setItem("accessToken", accessToken);
        setUser(loggedInUser);

        return loggedInUser;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error(
                "Server logout request failed; clearing local session:",
                error.message,
            );
        } finally {
            sessionStorage.removeItem("accessToken");
            setUser(null);
        }
    }, []);

    const value = useMemo(() => ({
        user, isInitializing, isAuthenticated: Boolean(user), login, logout
    }), [user, isInitializing, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);