
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logoWisoft from '../assets/images/wisoft.webp';
import logoAsap from '../assets/images/asap.png';

interface HeaderProps {
    showBackButton?: boolean;
    showProfileButton?: boolean;
    showDashboardBack?: boolean;
    onProfileClick?: () => void;
    onDashboardBack?: () => void;
}

function Header({ 
    showBackButton = false,
    showProfileButton = false,
    showDashboardBack = false,
    onProfileClick,
    onDashboardBack 
}: Readonly<HeaderProps>) {
    return (
        <div className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="h-20 flex items-center">
                            <img
                                src={logoAsap}
                                alt="ASAP Consulting Logo" 
                                className="h-full w-auto object-contain"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            {showProfileButton && (
                                <button
                                    onClick={onProfileClick}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Perfiles de Recursos
                                </button>
                            )}
                            <div className="h-12 flex items-center">
                                <img 
                                    src={logoWisoft}
                                    alt="WISOFT Logo" 
                                    className="h-full w-auto object-contain"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Sección de navegación */}
                    <div className="flex justify-between items-center">
                        {(showBackButton || showDashboardBack) && (
                            <div className="flex items-center gap-4">
                                {showDashboardBack ? (
                                    <button
                                        onClick={onDashboardBack}
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 mr-2" />
                                        Volver al Dashboard
                                    </button>
                                ) : (
                                    <Link 
                                        to="/" 
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 mr-2" />
                                        Volver al inicio
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Header;