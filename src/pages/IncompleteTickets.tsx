import { useState, useEffect } from 'react';
import { Filter, Check, X, Download } from 'lucide-react';
import { UserStory, IncompleteTicket } from '../services/api';
import { useTickets } from '../context/TicketsContext';
import Header from '../components/Header';
import * as XLSX from 'xlsx';

function IncompleteTickets() {
    const { userStories, incompleteTickets, loading, error } = useTickets();
    const [selectedTab, setSelectedTab] = useState<'userStories' | 'otherTickets'>('userStories');
    const [filteredStories, setFilteredStories] = useState<UserStory[]>(userStories);
    const [filteredTickets, setFilteredTickets] = useState<IncompleteTicket[]>(incompleteTickets);

    // Filtros para User Stories
    const [showWithoutDescription, setShowWithoutDescription] = useState(false);
    const [showWithoutAcceptanceCriteria, setShowWithoutAcceptanceCriteria] = useState(false);
    const [showWithDescription, setShowWithDescription] = useState(false);
    const [showWithAcceptanceCriteria, setShowWithAcceptanceCriteria] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    // Filtros para Otros Tickets
    const [ticketState, setTicketState] = useState<string>('');
    const [showWithoutDescriptionTickets, setShowWithoutDescriptionTickets] = useState(false);
    const [showWithoutEstimatedHours, setShowWithoutEstimatedHours] = useState(false);
    const [showWithoutCompletedHours, setShowWithoutCompletedHours] = useState(false);

    // Actualizar los estados filtrados cuando cambien los datos del contexto
    useEffect(() => {
        setFilteredStories(userStories);
        setFilteredTickets(incompleteTickets);
    }, [userStories, incompleteTickets]);

    // Filtrar User Stories
    useEffect(() => {
        let filtered = userStories;

        if (showWithoutDescription) {
            filtered = filtered.filter((story) => !story.description);
        }
        if (showWithoutAcceptanceCriteria) {
            filtered = filtered.filter((story) => !story.acceptanceCriteria);
        }
        if (showWithDescription) {
            filtered = filtered.filter((story) => story.description);
        }
        if (showWithAcceptanceCriteria) {
            filtered = filtered.filter((story) => story.acceptanceCriteria);
        }

        setFilteredStories(filtered);
    }, [
        showWithoutDescription,
        showWithoutAcceptanceCriteria,
        showWithDescription,
        showWithAcceptanceCriteria,
        userStories,
    ]);

    // Filtrar Otros Tickets
    useEffect(() => {
        let filtered = tickets;

        if (ticketState) {
            filtered = filtered.filter((ticket) => ticket.state === ticketState);
        }
        if (showWithoutDescriptionTickets) {
            filtered = filtered.filter((ticket) => {
                // Considerar "vacía" si está vacía, contiene solo espacios, o es "No disponible"
                return (
                    !ticket.description || 
                    ticket.description.trim() === "" || 
                    ticket.description.trim().toLowerCase() === "no disponible"
                );
            });
        }
        if (showWithoutEstimatedHours) {
            filtered = filtered.filter((ticket) => {
                const estimatedHours =
                    typeof ticket.estimatedHours === "number"
                        ? ticket.estimatedHours
                        : parseFloat(ticket.estimatedHours);
                return isNaN(estimatedHours) || estimatedHours <= 0;
            });
        }
        if (showWithoutCompletedHours) {
            filtered = filtered.filter((ticket) => {
                const completedHours =
                    typeof ticket.completedHours === "number"
                        ? ticket.completedHours
                        : parseFloat(ticket.completedHours);
                return isNaN(completedHours) || completedHours <= 0;
            });
        }

        setFilteredTickets(filtered);
    }, [
        ticketState,
        showWithoutDescriptionTickets,
        showWithoutEstimatedHours,
        showWithoutCompletedHours,
        incompleteTickets,
    ]);


    const CompletionIndicator = ({ isComplete }: { isComplete: boolean }) => {
        return isComplete ? (
            <Check className="w-6 h-6 text-green-600" />
        ) : (
            <X className="w-6 h-6 text-red-600" />
        );
    };

    const mapUserStoryToExcel = (story: UserStory) => ({
        ID: story.id,
        Título: story.title,
        'Tiene Descripción': story.description ? 'Sí' : 'No',
        'Tiene Criterios de Aceptación': story.acceptanceCriteria ? 'Sí' : 'No'
    });

    const mapTicketToExcel = (ticket: IncompleteTicket) => ({
        ID: ticket.id,
        Título: ticket.title,
        Estado: ticket.state,
        'Horas Estimadas': ticket.estimatedHours,
        'Horas Completadas': ticket.completedHours,
        'Tiene Descripción': ticket.description.trim() !== '' ? 'Sí' : 'No'
    });

    const exportToExcel = () => {
        let workbookData;

        if (selectedTab === 'userStories') {
            workbookData = filteredStories.map(mapUserStoryToExcel);
        } else {
            workbookData = filteredTickets.map(mapTicketToExcel);
        }

        const worksheet = XLSX.utils.json_to_sheet(workbookData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, selectedTab === 'userStories' ? 'User Stories' : 'Tickets');
        
        // Generar el archivo Excel
        XLSX.writeFile(workbook, selectedTab === 'userStories' ? 'user-stories.xlsx' : 'tickets.xlsx');
    };

    return (
        <div className="min-h-screen bg-white">
            <Header showBackButton />
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold text-[#2461b3] mb-8">Tickets Incompletos</h1>

                    {/* Tabs and Export Button Container */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setSelectedTab('userStories')}
                                className={`px-4 py-2 rounded ${
                                    selectedTab === 'userStories'
                                        ? 'bg-[#2461b3] text-white'
                                        : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                                User Stories
                            </button>
                            <button
                                onClick={() => setSelectedTab('otherTickets')}
                                className={`px-4 py-2 rounded ${
                                    selectedTab === 'otherTickets'
                                        ? 'bg-[#2461b3] text-white'
                                        : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                                Otros Tickets
                            </button>
                        </div>
                        <button
                            onClick={exportToExcel}
                            className="flex items-center px-4 py-2 bg-[#2461b3] text-white rounded-lg hover:bg-[#1a4a8f] transition-colors"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Exportar a Excel
                        </button>
                    </div>

                    {loading && (
                        <div className="text-center">
                            <p className="text-blue-800">Cargando datos...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 p-4 rounded-lg mb-4">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Tabla de User Stories */}
                    {selectedTab === 'userStories' && !loading && !error && (
                        <>
                            {/* Botón de filtro */}
                            <div className="mb-4 relative">
                                <button
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                >
                                    <Filter className="w-6 h-6 mr-2" />
                                    Filtros
                                </button>

                                {isFilterMenuOpen && (
                                    <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64">
                                        <h2 className="text-lg font-bold text-gray-800 mb-4">
                                            Filtrar por campo
                                        </h2>
                                        <label className="inline-flex items-center mb-3">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-blue-600"
                                                checked={showWithoutDescription}
                                                onChange={(e) =>
                                                    setShowWithoutDescription(e.target.checked)
                                                }
                                            />
                                            <span className="ml-2 text-gray-800">Sin descripción</span>
                                        </label>
                                        <label className="inline-flex items-center mb-3">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-blue-600"
                                                checked={showWithDescription}
                                                onChange={(e) =>
                                                    setShowWithDescription(e.target.checked)
                                                }
                                            />
                                            <span className="ml-2 text-gray-800">Con descripción</span>
                                        </label>
                                        <label className="inline-flex items-center mb-3">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-blue-600"
                                                checked={showWithoutAcceptanceCriteria}
                                                onChange={(e) =>
                                                    setShowWithoutAcceptanceCriteria(e.target.checked)
                                                }
                                            />
                                            <span className="ml-2 text-gray-800">
                                                Sin criterios de aceptación
                                            </span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-blue-600"
                                                checked={showWithAcceptanceCriteria}
                                                onChange={(e) =>
                                                    setShowWithAcceptanceCriteria(e.target.checked)
                                                }
                                            />
                                            <span className="ml-2 text-gray-800">
                                                Con criterios de aceptación
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {filteredStories.length === 0 ? (
                                <div className="text-center bg-blue-50 p-8 rounded-lg">
                                    <p className="text-blue-800 text-xl">
                                        No hay user stories que coincidan con los filtros
                                    </p>
                                </div>
                            ) : (
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
                                            {filteredStories.map((story) => (
                                                <tr key={story.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-blue-800">
                                                        #{story.id}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700">{story.title}</td>
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
                        </>
                    )}

                    {/* Tabla de Otros Tickets */}
                    {selectedTab === 'otherTickets' && !loading && !error && (
                        <>
                            {/* Botón de Filtro */}
                            <div className="mb-4 relative">
                                <button
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} // Cambiar el estado del menú
                                >
                                    <Filter className="w-6 h-6 mr-2" />
                                    Filtros
                                </button>

                                {/* Menú de Filtros */}
                                {isFilterMenuOpen && (
                                    <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64">
                                        <h2 className="text-lg font-bold text-gray-800 mb-4">Filtrar Tickets</h2>
                                        
                                        {/* Filtro por Estado */}
                                        <label className="inline-flex items-center mb-3">
                                            <span className="mr-2 text-gray-800">Estado:</span>
                                            <select
                                                className="form-select text-blue-600 border border-gray-300 rounded"
                                                value={ticketState}
                                                onChange={(e) => setTicketState(e.target.value)}
                                            >
                                                <option value="">Todos</option>
                                                <option value="New">Nuevo</option>
                                                <option value="Active">Activo</option>
                                                <option value="Inactive">Inactivo</option>
                                                <option value="Design">Diseño</option>
                                                <option value="Closed">Cerrado</option>
                                            </select>
                                        </label>

                                        {/* Filtro por Descripción */}
                                        <label className="inline-flex items-center mb-3">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-blue-600"
                                                checked={showWithoutDescriptionTickets}
                                                onChange={(e) => setShowWithoutDescriptionTickets(e.target.checked)}
                                            />
                                            <span className="ml-2 text-gray-800">Sin descripción</span>
                                        </label>

                                        {/* Filtro por Estimación de Horas */}
                                        <label className="inline-flex items-center mb-3">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-blue-600"
                                                checked={showWithoutEstimatedHours}
                                                onChange={(e) => setShowWithoutEstimatedHours(e.target.checked)}
                                            />
                                            <span className="ml-2 text-gray-800">Sin estimación de horas</span>
                                        </label>

                                        {/* Filtro por Horas Completadas */}
                                        <label className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-blue-600"
                                                checked={showWithoutCompletedHours}
                                                onChange={(e) => setShowWithoutCompletedHours(e.target.checked)}
                                            />
                                            <span className="ml-2 text-gray-800">Sin horas completadas</span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Tabla */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <thead>
                                        <tr className="bg-blue-50">
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">ID</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">Título</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">Estado</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">Estimación (Horas)</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">Horas Completadas</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">Descripción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredTickets.map((ticket) => (
                                            <tr key={ticket.id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-blue-800">#{ticket.id}</td>
                                                <td className="px-6 py-4 text-gray-700">{ticket.title}</td>
                                                <td className="px-6 py-4 text-gray-700">{ticket.state}</td>
                                                <td className="px-6 py-4">
                                                    {/* Evaluar estimatedHours */}
                                                    <CompletionIndicator 
                                                        isComplete={typeof ticket.estimatedHours === "number" && ticket.estimatedHours > 0} 
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    {/* Evaluar completedHours */}
                                                    <CompletionIndicator 
                                                        isComplete={typeof ticket.completedHours === "number" && ticket.completedHours > 0} 
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    {/* Evaluar descripción */}
                                                    <CompletionIndicator 
                                                        isComplete={ticket.description.trim() !== "" && ticket.description.trim() !== "No disponible"} 
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default IncompleteTickets;