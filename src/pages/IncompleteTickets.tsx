import { useState, useEffect } from 'react';
import { Filter, Check, X, Download,  ExternalLink, ArrowUpDown, ChevronDown  } from 'lucide-react';
import { UserStory, IncompleteTicket } from '../services/api';
import { useTickets } from '../contexts/TicketsContext';
import Header from '../components/Header';
import { formatDate } from '../utils/dateUtils';
import { exportToExcel } from '../utils/excelExport';

function IncompleteTickets() {
    const { userStories: contextUserStories, incompleteTickets: contextIncompleteTickets, loading, error } = useTickets();
    const [selectedTab, setSelectedTab] = useState<'userStories' | 'otherTickets'>('userStories');
    const [filteredStories, setFilteredStories] = useState<UserStory[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<IncompleteTicket[]>([]);

    // Filtros para User Stories
    const [showWithoutDescription, setShowWithoutDescription] = useState(false);
    const [showWithoutAcceptanceCriteria, setShowWithoutAcceptanceCriteria] = useState(false);
    const [showWithDescription, setShowWithDescription] = useState(false);
    const [showWithAcceptanceCriteria, setShowWithAcceptanceCriteria] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    const [assignedFilter, setAssignedFilter] = useState<string>('');
    const uniqueAssignedUsers = Array.from(new Set(contextUserStories.map((story) => story.assigned_to || 'No asignado')));

    const [tagFilter, setTagFilter] = useState<string>('');
    const uniqueTag = Array.from(new Set(contextUserStories.map((story) => story.tags || 'Sin etiquetas')));
    
    const [stateFilter, setStateFilter] = useState<string>('');
    const uniqueState = Array.from(new Set(contextUserStories.map((story) => story.state || 'No asignado')));
    
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const uniqueDates = Array.from(new Set(contextUserStories.map(story => story.due_date).filter(Boolean))).sort();

    // Filtros para Otros Tickets
    const [ticketState, setTicketState] = useState<string>('');
    const [showWithoutDescriptionTickets, setShowWithoutDescriptionTickets] = useState(false);
    const [showWithoutEstimatedHours, setShowWithoutEstimatedHours] = useState(false);
    const [showWithoutCompletedHours, setShowWithoutCompletedHours] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const WorkItemLink = ({ url }: { url: string }) => (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
            onClick={(e) => {
                e.stopPropagation();
                window.open(url, '_blank');
            }}
        >
            <ExternalLink className="w-4 h-4 ml-2" />
        </a>
    );

    // Inicializar los estados filtrados cuando cambien los datos del contexto
    useEffect(() => {
        if (Array.isArray(contextUserStories)) {
            setFilteredStories(contextUserStories);
        } else {
            setFilteredStories([]);
        }
        
        if (Array.isArray(contextIncompleteTickets)) {
            setFilteredTickets(contextIncompleteTickets);
        } else {
            setFilteredTickets([]);
        }
    }, [contextUserStories, contextIncompleteTickets]);

    // Filtrar User Stories
    useEffect(() => {
        if (!Array.isArray(contextUserStories)) return;
        
        let filtered = [...contextUserStories];

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
        if (assignedFilter) {
            filtered = filtered.filter((story) => story.assigned_to === assignedFilter);
        }
        if (tagFilter) {
            filtered = filtered.filter((story) => story.tags === tagFilter);
        }
        if (stateFilter) {
            filtered = filtered.filter((story) => story.state === stateFilter);
        }
        if (selectedDates.length > 0 && !selectedDates.includes("Todos")) {
            filtered = filtered.filter(story => selectedDates.includes(story.due_date));
        }
        // Ordenar por fecha de entrega
        filtered.sort((a, b) => {
            const dateA = new Date(a.due_date || '9999-12-31').getTime();
            const dateB = new Date(b.due_date || '9999-12-31').getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFilteredStories(filtered);
    }, [
        showWithoutDescription,
        showWithoutAcceptanceCriteria,
        showWithDescription,
        showWithAcceptanceCriteria,
        contextUserStories,
        assignedFilter,
        tagFilter,
        stateFilter,
        selectedDates, 
        sortOrder
    ]);

    // Filtrar Otros Tickets
    useEffect(() => {
        if (!Array.isArray(contextIncompleteTickets)) return;
        
        let filtered = [...contextIncompleteTickets];

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
                        : parseFloat(ticket.estimatedHours as string);
                return isNaN(estimatedHours) || estimatedHours <= 0;
            });
        }
        if (showWithoutCompletedHours) {
            filtered = filtered.filter((ticket) => {
                const completedHours =
                    typeof ticket.completedHours === "number"
                        ? ticket.completedHours
                        : parseFloat(ticket.completedHours as string);
                return isNaN(completedHours) || completedHours <= 0;
            });
        }

        setFilteredTickets(filtered);
    }, [
        ticketState,
        showWithoutDescriptionTickets,
        showWithoutEstimatedHours,
        showWithoutCompletedHours,
        contextIncompleteTickets,
    ]);

    const CompletionIndicator = ({ isComplete }: { isComplete: boolean }) => {
        return isComplete ? (
            <Check className="w-6 h-6 text-green-600" />
        ) : (
            <X className="w-6 h-6 text-red-600" />
        );
    };

    // Manejar la selección de fechas
    const handleDateSelection = (date: string) => {
        let updatedDates;
        if (date === "Todos") {
            updatedDates = selectedDates.includes("Todos") ? [] : ["Todos", ...uniqueDates];
        } else {
            updatedDates = selectedDates.includes(date) 
                ? selectedDates.filter(d => d !== date && d !== "Todos") 
                : [...selectedDates, date];

            if (updatedDates.length === uniqueDates.length) {
                updatedDates = ["Todos", ...uniqueDates];
            }
        }
        setSelectedDates(updatedDates);
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
                            onClick={() => exportToExcel(selectedTab, filteredStories, filteredTickets)}
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
                                        <label className="inline-flex items-center mb-3">
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
                                <div className="w-full max-w-screen-2xl px-6 mx-auto overflow-x-auto">
                                    <table className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <thead>
                                            <tr className="bg-blue-50">
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                                    ID
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800 w-[180px] min-w-[180px]">
                                                    Título
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                                    Descripción
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                                    Criterios de Aceptación
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">Story Points</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                                    Estado
                                                    <select
                                                        className="ml-2 px-2 py-1 border rounded text-gray-700 hover:border-blue-500"
                                                        value={stateFilter}
                                                        onChange={(e) => setStateFilter(e.target.value)}
                                                    >
                                                        <option value="">Todos</option>
                                                        {uniqueState.map((user) => (
                                                            <option key={user} value={user}>{user}</option>
                                                        ))}
                                                    </select>
                                                </th>
                                                <th className="px-3 py-3 text-left text-sm font-semibold text-blue-800 w-[120px] max-w-[120px]">
                                                    Asignado
                                                    <select
                                                        className="ml-2 px-2 py-1 border rounded text-gray-700 w-full hover:border-blue-500"
                                                        value={assignedFilter}
                                                        onChange={(e) => setAssignedFilter(e.target.value)}
                                                    >
                                                        <option value="">Todos</option>
                                                        {uniqueAssignedUsers.map((user, index) => (
                                                            <option key={index} value={user?.toString() || ''}>{user}</option>
                                                        ))}
                                                    </select>
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 ">
                                                    Tags
                                                    <select
                                                        className="ml-2 px-2 py-1 border rounded text-gray-700 hover:border-blue-500"
                                                        value={tagFilter}
                                                        onChange={(e) => setTagFilter(e.target.value)}
                                                    >
                                                        <option value="">Todos</option>
                                                        {uniqueTag.map((user) => (
                                                            <option key={user} value={user}>{user}</option>
                                                        ))}
                                                    </select>
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                                    Fecha de entrega
                                                    <div className="relative inline-block ml-2">
                                                        <button 
                                                            className="ml-2 px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:border-blue-500"
                                                            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                                                        >
                                                            Filtro
                                                            <ChevronDown className="w-4 h-4 ml-1" />
                                                        </button>
                                                        {isDateFilterOpen && (
                                                            <div className="absolute z-10 bg-white border border-gray-300 rounded shadow-lg p-2 mt-1 w-48">
                                                                <label className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedDates.includes("Todos")}
                                                                        onChange={() => handleDateSelection("Todos")}
                                                                        className="mr-2"
                                                                    />
                                                                    Todos
                                                                </label>
                                                                {uniqueDates.map(date => (
                                                                    <label key={date} className="flex items-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedDates.includes(date)}
                                                                            onChange={() => handleDateSelection(date)}
                                                                            className="mr-2"
                                                                        />
                                                                        {formatDate(date)}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        className="ml-2 text-gray-600 hover:text-blue-600"
                                                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                                    >
                                                        <ArrowUpDown className="w-4 h-4 inline-block" />
                                                    </button>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredStories.map((story) => (
                                                <tr key={story.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-blue-800">
                                                        <div className="flex items-center">
                                                            #{story.id}
                                                            <WorkItemLink url={story.work_item_url} />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-700 w-[180px] min-w-[180px]">{story.title}</td>
                                                    <td className="px-6 py-4">
                                                        <CompletionIndicator isComplete={Boolean(story.description)} />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <CompletionIndicator isComplete={Boolean(story.acceptanceCriteria)} />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <CompletionIndicator isComplete={typeof story.story_points === "number" && story.story_points > 0} />
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700">{story.state}</td>
                                                    <td className="px-3 py-4 text-gray-700 w-[120px] max-w-[140px] truncate overflow-hidden text-ellipsis whitespace-nowrap">{story.assigned_to}</td>
                                                    <td className="px-6 py-4 text-gray-700">{story.tags}</td>
                                                    <td className="px-6 py-4 text-gray-700">{formatDate(story.due_date)}</td>
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
                                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
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
                            <div className="w-full max-w-screen-2xl px-6 mx-auto overflow-x-auto">
                                <table className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
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
                                                <td className="px-6 py-4 font-medium text-blue-800">
                                                    <div className="flex items-center">
                                                        #{ticket.id}
                                                        <WorkItemLink url={ticket.work_item_url} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">{ticket.title}</td>
                                                <td className="px-6 py-4 text-gray-700">{ticket.state}</td>
                                                <td className="px-6 py-4">
                                                    <CompletionIndicator 
                                                        isComplete={typeof ticket.estimatedHours === "number" && ticket.estimatedHours > 0} 
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <CompletionIndicator 
                                                        isComplete={typeof ticket.completedHours === "number" && ticket.completedHours > 0} 
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
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