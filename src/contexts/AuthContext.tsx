import { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Función de inicio de sesión conectada al backend
    const login = async (username: string, password: string) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            formData.append('grant_type', 'password');
    
            const response = await axios.post(`${import.meta.env.VITE_BACK_URL}/login`, formData, {
                headers: {
                    'Accept': 'application/json',
                },
                withCredentials: true
            });
    
            if (response.data.message === 'Inicio de sesión exitoso') {
                setIsAuthenticated(true);
                console.log('Usuario autenticado correctamente');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            throw new Error('Usuario o contraseña incorrectos');
        }
    };

    // Función de cierre de sesión
    const logout = () => {
        setIsAuthenticated(false);
        console.log('Sesión cerrada');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
