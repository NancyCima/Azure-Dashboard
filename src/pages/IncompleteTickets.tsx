import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { api, UserStory } from '../services/api';

function IncompleteTickets() {
    const [userStories, setUserStories] = useState<UserStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserStories = async () => {
            try {
                const data = await api.getUserStories();
                setUserStories(data);
                setLoading(false);
            } catch (err) {
                setError('Error al cargar las user stories');
                setLoading(false);
            }
        };

        fetchUserStories();
    }, []);

    const CompletionIndicator = ({ isComplete }: { isComplete: boolean }) => {
        return isComplete ? (
            <Check className="w-6 h-6 text-green-600" />
        ) : (
            <X className="w-6 h-6 text-red-600" />
        );
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
                <h1 className="text-4xl font-bold text-blue-800 mb-8">
                    User Stories Incompletas
                </h1>

                {loading && (
                    <div className="text-center">
                        <p className="text-blue-800">Cargando user stories...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 p-4 rounded-lg mb-4">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {!loading && !error && userStories.length === 0 && (
                    <div className="text-center bg-blue-50 p-8 rounded-lg">
                        <p className="text-blue-800 text-xl">No hay user stories incompletas</p>
                    </div>
                )}

                {!loading && !error && userStories.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                            <thead>
                                <tr className="bg-blue-50">
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                        Título
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                        Descripción
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                        Criterios de Aceptación
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {userStories.map((story) => (
                                    <tr
                                        key={story.id} // Usar el ID único como clave
                                        className="hover:bg-blue-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-blue-800">
                                            #{story.id}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {story.title}
                                        </td>
                                        <td className="px-6 py-4">
                                            <CompletionIndicator isComplete={Boolean(story.description)} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <CompletionIndicator isComplete={Boolean(story.acceptanceCriteria)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IncompleteTickets;
