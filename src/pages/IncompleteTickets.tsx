import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api, Ticket } from '../services/api';

function IncompleteTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTickets = async () => {
        try {
            const data = await api.getTickets();
            setTickets(data);
            setLoading(false);
        } catch (err) {
            setError('Error al cargar los tickets');
            setLoading(false);
        }
        };

        fetchTickets();
    }, []);

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
            <h1 className="text-4xl font-bold text-blue-800 mb-8">Tickets Incompletos</h1>
            
            {loading && (
            <div className="text-center">
                <p className="text-blue-800">Cargando tickets...</p>
            </div>
            )}

            {error && (
            <div className="bg-red-50 p-4 rounded-lg mb-4">
                <p className="text-red-600">{error}</p>
            </div>
            )}

            {!loading && !error && (
            <div className="grid gap-4">
                {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-blue-50 p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold text-blue-800 mb-2">{ticket.title}</h3>
                    <p className="text-blue-600 mb-2">{ticket.description}</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {ticket.status}
                    </span>
                </div>
                ))}
            </div>
            )}
        </div>
        </div>
    );
}

export default IncompleteTickets;