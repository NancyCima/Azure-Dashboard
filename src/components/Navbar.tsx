import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-end">
            <button
            onClick={handleLogout}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
            </button>
        </div>
        </nav>
    );
}

export default Navbar;