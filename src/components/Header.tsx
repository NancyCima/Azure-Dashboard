
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logoWisoft from '../assets/images/wisoft.webp';
import logoAsap from '../assets/images/asap.png';

interface HeaderProps {
    showBackButton?: boolean;
}

function Header({ showBackButton = false }: HeaderProps) {
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
                        <div className="h-12 flex items-center">
                            <img 
                                src={logoWisoft}
                                alt="WISOFT Logo" 
                                className="h-full w-auto object-contain"
                            />
                        </div>
                    </div>
                    {showBackButton && (
                        <div className="flex justify-start">
                            <Link 
                                to="/" 
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Volver al inicio
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Header;