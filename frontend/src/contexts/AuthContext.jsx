import React, { createContext, useContext, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const VITE_BACKEND_URL =  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect( async () => {
      const loadUser = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
          setUser(null);
          return "error: no token";
        }

        try {
          const res = await fetch(`${VITE_BACKEND_URL}/user/me`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          const data = await res.json();

          if (!res.ok) {
            localStorage.removeItem("token");
            setUser(null);
            return data.message;
          }

          setUser(data);

        } catch (err) {
          console.error("Failed to fetch user:", err);
          setUser(null);
          return err;
        }
      }
      loadUser();
    }, []);

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
      try {
        const res = await fetch(`${VITE_BACKEND_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          return data.message;
        }

        // 1
        localStorage.setItem("token", data.token);

        // 2
        const res1 = await fetch(`${VITE_BACKEND_URL}/user/me`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${data.token}`,
          },
        });
        const data1 = await res1.json();
        setUser(data1);

        // 3
        navigate("/profile");

      } catch (err) {
        console.error("Failed to login user:", err);
        return err;
      }
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
      const { username, firstname, lastname, password } = userData;
      try{
        const res = await fetch(`${VITE_BACKEND_URL}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, firstname, lastname, password }),
        });

        if(!res.ok){
          const data = await res.json();
          return data.message;
        }else{
          navigate("/success");
        }
      }catch(err){
        return err;
      }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
