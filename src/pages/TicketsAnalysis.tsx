import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, Upload, Search, User, Loader2, Copy, Check } from 'lucide-react';
import { api, Ticket } from '../services/api';

function TicketsAnalysis() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<{
        suggestedCriteria: string[];
        imageAnalysis?: string;
        generalSuggestions?: string[];
    } | null>(null);
    const [copied, setCopied] = useState(false);

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

    const filteredTickets = tickets.filter(ticket => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
            ticket.title.toLowerCase().includes(searchTermLower) || 
            ticket.id.toString().includes(searchTerm)
        );
    });

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedTicket) return;

        setAnalyzing(true);
        setAiAnalysis(null);
        setError(null);

        try {
            const analysis = await api.analyzeTicket(selectedTicket, selectedImage);
            setAiAnalysis(analysis);
        } catch (err) {
            setError('Error al analizar el ticket');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCopy = async () => {
        if (!aiAnalysis?.suggestedCriteria) return;

        try {
            await navigator.clipboard.writeText(aiAnalysis.suggestedCriteria.join('\n'));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setError('Error al copiar al portapapeles');
        }
    };

    const cleanHtmlContent = (html: string) => {
        // Remove background-color styles from spans
        return html.replace(/style="[^"]*background-color:[^"]*"/g, '');
    };

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

                <div className="mb-8 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título o ID del ticket..."
                        className="w-full pl-10 pr-4 py-2 border-2 border-blue-100 rounded-lg focus:outline-none focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => {
                                setSelectedTicket(ticket);
                                setAiAnalysis(null);
                                setSelectedImage(null);
                            }}
                            className="bg-blue-50 p-6 rounded-lg shadow-md cursor-pointer transform transition-transform hover:scale-105"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <span className="text-gray-900 font-mono">#{ticket.id}</span>
                                    <h3 className="text-xl font-semibold text-gray-900 ml-2">{ticket.title}</h3>
                                </div>
                            </div>
                            <div className="flex items-center mb-3">
                                <User className="w-4 h-4 text-blue-600 mr-2" />
                                <span className="text-blue-600 text-sm">{ticket.assigned_to.displayName}</span>
                            </div>
                            <div 
                                className="prose prose-sm max-w-none mb-2 line-clamp-2 [&>*]:text-gray-600 [&>*]:!font-normal [&_strong]:!text-gray-700 [&_strong]:!font-medium"
                                dangerouslySetInnerHTML={{ __html: cleanHtmlContent(ticket.description) }}
                            />
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    {ticket.state}
                                </span>
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    {ticket.work_item_type}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedTicket && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center mb-2">
                                            <h2 className="text-2xl font-bold text-gray-900">{selectedTicket.title}</h2>
                                        </div>
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 text-blue-600 mr-2" />
                                            <span className="text-blue-600">{selectedTicket.assigned_to.displayName}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedTicket(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="mb-8">
                                    <h3 className="font-semibold text-gray-700 mb-3">Descripción:</h3>
                                    <div 
                                        className="prose prose-blue max-w-none bg-gray-50 p-4 rounded-lg [&>*]:text-gray-600 [&>*]:!font-normal [&_strong]:!text-gray-700 [&_strong]:!font-medium"
                                        dangerouslySetInnerHTML={{ __html: cleanHtmlContent(selectedTicket.description) }}
                                    />
                                </div>

                                <div className="mb-8">
                                    <h3 className="font-semibold text-gray-700 mb-3">Criterios de Aceptación Actuales:</h3>
                                    <div 
                                        className="prose prose-blue max-w-none bg-gray-50 p-4 rounded-lg [&>*]:text-gray-600 [&>*]:!font-normal [&_strong]:!text-gray-700 [&_strong]:!font-medium"
                                        dangerouslySetInnerHTML={{ __html: cleanHtmlContent(selectedTicket.acceptance_criteria) }}
                                    />
                                </div>

                                <div className="mb-8">
                                    <h3 className="font-semibold text-gray-700 mb-3">Cargar Imagen:</h3>
                                    <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-500 focus:outline-none">
                                        <div className="flex flex-col items-center space-y-2">
                                            <Upload className="w-6 h-6 text-gray-400" />
                                            <span className="text-sm text-gray-500">
                                                {selectedImage ? selectedImage.name : 'Seleccionar imagen'}
                                            </span>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                </div>

                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="w-full mb-8 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center"
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Analizando...
                                        </>
                                    ) : (
                                        'Analizar con IA'
                                    )}
                                </button>

                                {aiAnalysis && (
                                    <div className="mb-8">
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-gray-700">Criterios de Aceptación Sugeridos:</h3>
                                                <button
                                                    onClick={handleCopy}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                    {copied ? (
                                                        <Check className="w-5 h-5 mr-1" />
                                                    ) : (
                                                        <Copy className="w-5 h-5 mr-1" />
                                                    )}
                                                    {copied ? 'Copiado!' : 'Copiar'}
                                                </button>
                                            </div>
                                            <ul className="list-disc pl-5 space-y-2 bg-gray-50 p-4 rounded-lg">
                                                {aiAnalysis.suggestedCriteria.map((criteria, index) => (
                                                    <li key={index} className="text-gray-600">{criteria}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {aiAnalysis.generalSuggestions && aiAnalysis.generalSuggestions.length > 0 && (
                                            <div className="mt-6">
                                                <h3 className="font-semibold text-gray-700 mb-3">Sugerencias Generales:</h3>
                                                <ul className="list-disc pl-5 space-y-2 bg-gray-50 p-4 rounded-lg">
                                                    {aiAnalysis.generalSuggestions.map((suggestion, index) => (
                                                        <li key={index} className="text-gray-600">{suggestion}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {aiAnalysis.imageAnalysis && (
                                            <div className="mt-6">
                                                <h3 className="font-semibold text-gray-700 mb-3">Análisis de Imagen:</h3>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-gray-600">{aiAnalysis.imageAnalysis}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        Estado: {selectedTicket.state}
                                    </span>
                                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        Tipo: {selectedTicket.work_item_type}
                                    </span>
                                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        Última modificación: {new Date(selectedTicket.changed_date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TicketsAnalysis;