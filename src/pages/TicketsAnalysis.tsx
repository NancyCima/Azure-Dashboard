import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function TicketsAnalysis() {
    return (
        <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
            <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors"
            >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al inicio
            </Link>
            <h1 className="text-4xl font-bold text-blue-800 mb-8">Análisis de Tickets</h1>
            <div className="bg-blue-50 p-8 rounded-lg shadow">
            <p className="text-blue-800 text-xl">Página en construcción</p>
            </div>
        </div>
        </div>
    );
    }

export default TicketsAnalysis;