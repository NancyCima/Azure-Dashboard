import { useState, useEffect } from 'react';
import { Filter, Check, X, Download,  ExternalLink, ArrowUpDown} from 'lucide-react';
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
    const [isCriteriaFilterOpen, setIsCriteriaFilterOpen] = useState(false);
    const [showWithoutAcceptanceCriteria, setShowWithoutAcceptanceCriteria] = useState(false);
    const [showWithAcceptanceCriteria, setShowWithAcceptanceCriteria] = useState(false);

    const [isDescriptionFilterOpen, setIsDescriptionFilterOpen] = useState(false);
    const [showWithoutDescription, setShowWithoutDescription] = useState(false);
    const [showWithDescription, setShowWithDescription] = useState(false);

    const [isStoryPointsFilterOpen, setIsStoryPointsFilterOpen] = useState(false);
    const [filterStoryPoints, setFilterStoryPoints] = useState<string | null>(null);

    const [isAssignedFilterOpen, setIsAssignedFilterOpen] = useState(false);
    const [assignedFilter, setAssignedFilter] = useState<string>('');
    const uniqueAssignedUsers = Array.from(new Set(contextUserStories.map((story) => story.assigned_to || 'No asignado')));

    const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
    const [tagFilter, setTagFilter] = useState<string>('');
    const uniqueTag = Array.from(new Set(contextUserStories.map((story) => story.tags || 'Sin etiquetas')));
    
    const [isStateFilterOpen, setIsStateFilterOpen] = useState(false);
    const [stateFilter, setStateFilter] = useState<string>('');
    const uniqueState = Array.from(new Set(contextUserStories.map((story) => story.state || 'No asignado')));
    
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const uniqueDates = Array.from(new Set(contextUserStories.map(story => story.due_date).filter(Boolean))).sort();

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Filtros para Otros Tickets
    const [isTicketStateFilterOpen, setIsTicketStateFilterOpen] = useState(false);
    const [ticketStateFilter, setTicketStateFilter] = useState<string>('');
    const uniqueTicketState = Array.from(new Set(contextIncompleteTickets.map((ticket) => ticket.state || 'No asignado')));

    const [isTicketDescriptionFilterOpen, setIsTicketDescriptionFilterOpen] = useState(false);
    const [showWithoutTicketDescription, setShowWithoutTicketDescription] = useState(false);
    const [showWithTicketDescription, setShowWithTicketDescription] = useState(false);

    const [ticketTypeFilter, setTicketTypeFilter] = useState<string>('');
    const [isTicketTypeFilterOpen, setIsTicketTypeFilterOpen] = useState(false);
    const uniqueTicketTypes = Array.from(new Set(contextIncompleteTickets.map(ticket => ticket.work_item_type || 'No especificado')));

    const [isEstimatedHoursFilterOpen, setIsEstimatedHoursFilterOpen] = useState(false);
    const [showWithEstimatedHours, setShowWithEstimatedHours] = useState(false);
    const [showWithoutEstimatedHours, setShowWithoutEstimatedHours] = useState(false);

    const [isCompletedHoursFilterOpen, setIsCompletedHoursFilterOpen] = useState(false);
    const [showWithCompletedHours, setShowWithCompletedHours] = useState(false);
    const [showWithoutCompletedHours, setShowWithoutCompletedHours] = useState(false);
    
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
        if (showWithDescription) {
            filtered = filtered.filter((story) => story.description);
        }
        if (showWithoutAcceptanceCriteria) {
            filtered = filtered.filter((story) => !story.acceptanceCriteria);
        }
        if (showWithAcceptanceCriteria) {
            filtered = filtered.filter((story) => story.acceptanceCriteria);
        }
        if (filterStoryPoints === "without") {
            filtered = filtered.filter((story) => {
                return story.story_points === "No disponible" || story.story_points === null || story.story_points === undefined;
            });
        }     
        if (filterStoryPoints === "with") {
            filtered = filtered.filter((story) => 
                typeof story.story_points === "number" && story.story_points > 0
            );
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
            const dateA = a.due_date && a.due_date !== "No disponible" 
                ? new Date(a.due_date).getTime() 
                : (sortOrder === 'asc' ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER);
            
            const dateB = b.due_date && b.due_date !== "No disponible" 
                ? new Date(b.due_date).getTime() 
                : (sortOrder === 'asc' ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER);
        
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFilteredStories(filtered);
    }, [
        showWithoutDescription,
        showWithoutAcceptanceCriteria,
        showWithDescription,
        showWithAcceptanceCriteria,
        filterStoryPoints,
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

        if (ticketStateFilter) {
            filtered = filtered.filter((ticket) => ticket.state === ticketStateFilter);
        }
        if (showWithoutTicketDescription) {
            filtered = filtered.filter((ticket) => !ticket.description);
        }
        if (showWithTicketDescription) {
            filtered = filtered.filter((ticket) => ticket.description);
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
        if (showWithEstimatedHours) {
            filtered = filtered.filter(ticket => 
                ticket.estimatedHours && ticket.estimatedHours !== "No disponible" && Number(ticket.estimatedHours) > 0
            );
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
        if (showWithCompletedHours) {
            filtered = filtered.filter(ticket => 
                ticket.completedHours && ticket.completedHours !== "No disponible" && Number(ticket.completedHours) > 0
            );
        }
        if (ticketTypeFilter) {
            filtered = filtered.filter((ticket) => ticket.work_item_type === ticketTypeFilter);
        }

        

        setFilteredTickets(filtered);
    }, [
        ticketStateFilter,
        showWithoutTicketDescription,
        showWithTicketDescription,
        showWithEstimatedHours, 
        showWithoutEstimatedHours, 
        showWithCompletedHours, 
        showWithoutCompletedHours,
        contextIncompleteTickets,
        ticketTypeFilter,
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
                            {filteredStories.length === 0 ? (
                                <div className="text-center bg-blue-50 p-8 rounded-lg">
                                    <p className="text-blue-800 text-xl">
                                        No hay user stories que coincidan con los filtros
                                    </p>
                                </div>
                            ) : (
                                <div className="px-6 mx-auto flex justify-center">
                                    <table className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <thead>
                                            <tr className="bg-blue-50">
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                                    ID
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800 w-[180px] min-w-[180px]">
                                                    Título
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 whitespace-nowrap">
                                                    <div className='flex items-center justify-between'>                                                    
                                                        <span>Descripción</span>
                                                        <button 
                                                            className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                            onClick={() => setIsDescriptionFilterOpen(!isDescriptionFilterOpen)}
                                                        >
                                                            <Filter className="w-4 h-4" />
                                                        </button>

                                                    </div>

                                                    {isDescriptionFilterOpen && (
                                                        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithDescription(false); 
                                                                    setShowWithoutDescription(false); 
                                                                    setIsDescriptionFilterOpen(false); 
                                                                }}
                                                            >
                                                                Todos
                                                            </button>
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithDescription(true); 
                                                                    setShowWithoutDescription(false); 
                                                                    setIsDescriptionFilterOpen(false); 
                                                                }}
                                                            >
                                                                Con descripción
                                                            </button>
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithDescription(false); 
                                                                    setShowWithoutDescription(true); 
                                                                    setIsDescriptionFilterOpen(false); 
                                                                }}
                                                            >
                                                                Sin descripción
                                                            </button>
                                                        </div>
                                                    )}
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 flex items-center">
                                                    <span>Criterios de Aceptación</span>
                                                    <button 
                                                        className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                        onClick={() => setIsCriteriaFilterOpen(!isCriteriaFilterOpen)}
                                                    >
                                                        <Filter className="w-4 h-4" />
                                                    </button>
                                                    {isCriteriaFilterOpen && (
                                                        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithAcceptanceCriteria(false); 
                                                                    setShowWithoutAcceptanceCriteria(false); 
                                                                    setIsCriteriaFilterOpen(false); 
                                                                }}
                                                            >
                                                                Todos
                                                            </button>
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithAcceptanceCriteria(true); 
                                                                    setShowWithoutAcceptanceCriteria(false); 
                                                                    setIsCriteriaFilterOpen(false); 
                                                                }}
                                                            >
                                                                Con criterios
                                                            </button>
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithAcceptanceCriteria(false); 
                                                                    setShowWithoutAcceptanceCriteria(true); 
                                                                    setIsCriteriaFilterOpen(false); 
                                                                }}
                                                            >
                                                                Sin criterios
                                                            </button>
                                                        </div>
                                                    )}
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 whitespace-nowrap">
                                                    <div className="flex items-center justify-between">
                                                        <span>Story Points</span>
                                                        <button 
                                                            className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                            onClick={() => setIsStoryPointsFilterOpen(!isStoryPointsFilterOpen)}
                                                        >
                                                            <Filter className="w-4 h-4" />
                                                        </button>
                                                        {isStoryPointsFilterOpen && (
                                                            <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                                <button 
                                                                    className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                    onClick={() => { setFilterStoryPoints(null); setIsStoryPointsFilterOpen(false); }}
                                                                >
                                                                    Todos
                                                                </button>
                                                                <button 
                                                                    className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                    onClick={() => { setFilterStoryPoints("with"); setIsStoryPointsFilterOpen(false); }}
                                                                >
                                                                    Con Story Points
                                                                </button>
                                                                <button 
                                                                    className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                    onClick={() => { setFilterStoryPoints("without"); setIsStoryPointsFilterOpen(false); }}
                                                                >
                                                                    Sin Story Points
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </th>
                                                <th className="px-3 py-3 text-left text-sm font-semibold text-blue-800 relative">
                                                    Estado
                                                    <button 
                                                        className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                        onClick={() => setIsStateFilterOpen(!isStateFilterOpen)}
                                                    >
                                                        <Filter className="w-4 h-4" />
                                                    </button>
                                                    {isStateFilterOpen && (
                                                        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { setStateFilter(""); setIsStateFilterOpen(false); }}>
                                                                Todos
                                                            </button>
                                                            {uniqueState.map(state => (
                                                                <button key={state} className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                    onClick={() => { setStateFilter(state); setIsStateFilterOpen(false); }}>
                                                                    {state}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </th>   
                                                <th className="px-3 py-3 text-left text-sm font-semibold text-blue-800 relative">
                                                    Asignado
                                                    <button 
                                                        className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                        onClick={() => setIsAssignedFilterOpen(!isAssignedFilterOpen)}
                                                    >
                                                        <Filter className="w-4 h-4" />
                                                    </button>
                                                    {isAssignedFilterOpen && (
                                                        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { setAssignedFilter(""); setIsAssignedFilterOpen(false); }}>
                                                                Todos
                                                            </button>
                                                            {uniqueAssignedUsers.map(user => (
                                                                <button key={user} className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                    onClick={() => { setAssignedFilter(user); setIsAssignedFilterOpen(false); }}>
                                                                    {user}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800 relative">
                                                    Tags
                                                    <button 
                                                        className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                        onClick={() => setIsTagFilterOpen(!isTagFilterOpen)}
                                                    >
                                                        <Filter className="w-4 h-4" />
                                                    </button>
                                                    {isTagFilterOpen && (
                                                        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { setTagFilter(""); setIsTagFilterOpen(false); }}>
                                                                Todos
                                                            </button>
                                                            {uniqueTag.map(tag => (
                                                                <button key={tag} className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                    onClick={() => { setTagFilter(tag); setIsTagFilterOpen(false); }}>
                                                                    {tag}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800 relative">
                                                    <span>Fecha de entrega</span>
                                                    <button 
                                                        className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                        onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                                                    >
                                                        <Filter className="w-4 h-4" />
                                                    </button>
                                                    {isDateFilterOpen && (
                                                        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { setSelectedDates([]); setIsDateFilterOpen(false); }}
                                                            >
                                                                Todos
                                                            </button>
                                                            {uniqueDates.map(date => (
                                                                <button 
                                                                    key={date} 
                                                                    className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                    onClick={() => { handleDateSelection(date); setIsDateFilterOpen(false); }}
                                                                >
                                                                    {formatDate(date)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
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
                            {/* Tabla */}
                            <div className="px-6 mx-auto flex justify-center">
                                <table className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <thead>
                                        <tr className="bg-blue-50">
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">ID</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800 w-[180px] min-w-[180px]">Título</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800 flex w-[180px] min-w-[180px]">
                                                Tipo de Ticket
                                                <div className="relative inline-block ml-2">
                                                    <button 
                                                        className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                        onClick={() => setIsTicketTypeFilterOpen(!isTicketTypeFilterOpen)}
                                                    >
                                                        <Filter className="w-4 h-4" />
                                                    </button>
                                                    {isTicketTypeFilterOpen && (
                                                        <div className="absolute left-0 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { setTicketTypeFilter(""); setIsTicketTypeFilterOpen(false); }}>
                                                                Todos
                                                            </button>
                                                            {uniqueTicketTypes.map(type => (
                                                                <button key={type} className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                    onClick={() => { setTicketTypeFilter(type); setIsTicketTypeFilterOpen(false); }}>
                                                                    {type}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-3 py-3 text-left text-sm font-semibold text-blue-800 relative">
                                                    Estado
                                                    <button 
                                                        className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                        onClick={() => setIsTicketStateFilterOpen(!isTicketStateFilterOpen)}
                                                    >
                                                        <Filter className="w-4 h-4" />
                                                    </button>
                                                    {isTicketStateFilterOpen && (
                                                        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { setTicketStateFilter(""); setIsTicketStateFilterOpen(false); }}>
                                                                Todos
                                                            </button>
                                                            {uniqueTicketState.map(state => (
                                                                <button key={state} className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                    onClick={() => { setTicketStateFilter(state); setIsTicketStateFilterOpen(false); }}>
                                                                    {state}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </th>   
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                                    <div className="flex items-center">
                                                        Estimación (Horas)
                                                        <button 
                                                            className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                            onClick={() => setIsEstimatedHoursFilterOpen(!isEstimatedHoursFilterOpen)}
                                                        >
                                                            <Filter className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    {isEstimatedHoursFilterOpen && (
                                                        <div className="absolute z-10 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithEstimatedHours(false); 
                                                                    setShowWithoutEstimatedHours(false); 
                                                                    setIsEstimatedHoursFilterOpen(false); 
                                                                }}
                                                            >
                                                                Todos
                                                            </button>
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithEstimatedHours(true); 
                                                                    setShowWithoutEstimatedHours(false); 
                                                                    setIsEstimatedHoursFilterOpen(false); 
                                                                }}
                                                            >
                                                                Con estimación
                                                            </button>
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithEstimatedHours(false); 
                                                                    setShowWithoutEstimatedHours(true); 
                                                                    setIsEstimatedHoursFilterOpen(false); 
                                                                }}
                                                            >
                                                                Sin estimación
                                                            </button>
                                                        </div>
                                                    )}
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">
                                                    <div className="flex items-center">
                                                        Horas Completadas
                                                        <button 
                                                            className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                            onClick={() => setIsCompletedHoursFilterOpen(!isCompletedHoursFilterOpen)}
                                                        >
                                                            <Filter className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    {isCompletedHoursFilterOpen && (
                                                        <div className="absolute z-10 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithCompletedHours(false); 
                                                                    setShowWithoutCompletedHours(false); 
                                                                    setIsCompletedHoursFilterOpen(false); 
                                                                }}
                                                            >
                                                                Todos
                                                            </button>
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithCompletedHours(true); 
                                                                    setShowWithoutCompletedHours(false); 
                                                                    setIsCompletedHoursFilterOpen(false); 
                                                                }}
                                                            >
                                                                Con horas completadas
                                                            </button>
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithCompletedHours(false); 
                                                                    setShowWithoutCompletedHours(true); 
                                                                    setIsCompletedHoursFilterOpen(false); 
                                                                }}
                                                            >
                                                                Sin horas completadas
                                                            </button>
                                                        </div>
                                                    )}
                                                </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 whitespace-nowrap">
                                                    <div className='flex items-center justify-between'>                                                    
                                                        <span>Descripción</span>
                                                        <button 
                                                            className="ml-2 p-1 border rounded bg-white text-gray-700 hover:border-blue-500"
                                                            onClick={() => setIsTicketDescriptionFilterOpen(!isTicketDescriptionFilterOpen)}
                                                        >
                                                            <Filter className="w-4 h-4" />
                                                        </button>

                                                    </div>

                                                    {isTicketDescriptionFilterOpen && (
                                                        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithTicketDescription(false); 
                                                                    setShowWithoutTicketDescription(false); 
                                                                    setIsTicketDescriptionFilterOpen(false); 
                                                                }}
                                                            >
                                                                Todos
                                                            </button>
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithTicketDescription(true); 
                                                                    setShowWithoutTicketDescription(false); 
                                                                    setIsTicketDescriptionFilterOpen(false); 
                                                                }}
                                                            >
                                                                Con descripción
                                                            </button>
                                                            <button 
                                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                                                onClick={() => { 
                                                                    setShowWithTicketDescription(false); 
                                                                    setShowWithoutTicketDescription(true); 
                                                                    setIsTicketDescriptionFilterOpen(false); 
                                                                }}
                                                            >
                                                                Sin descripción
                                                            </button>
                                                        </div>
                                                    )}
                                                </th>
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
                                                <td className="px-6 py-4 text-gray-700">{ticket.work_item_type}</td>
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