import { useState, useMemo } from 'react';
import { Download} from 'lucide-react';
import { useTickets } from '../contexts/TicketsContext';
import Header from '../components/Header';
import { exportToExcel } from '../utils/excelExport';
import OtherTicketsTable from '../components/OtherTicketsTable';
import UserStoriesTable from '../components/UserStoriesTable';

// Componente principal
function IncompleteTickets() {
    const { userStories: contextUserStories, incompleteTickets: contextIncompleteTickets, loading, error } = useTickets();
    const [selectedTab, setSelectedTab] = useState<'userStories' | 'otherTickets'>('userStories');

    // Estado unificado para los filtros
    const [filters, setFilters] = useState({
        description: { with: false, without: false },
        acceptanceCriteria: { with: false, without: false },
        storyPoints: { with: false, without: false },
        assignedTo: '',
        tags: [] as string[],
        state: '',
        dueDate: [] as string[],
        ticketState: [] as string[],
        ticketType: [] as string[],
        ticketAssignedTo: '',
        ticketDescription: { with: false, without: false },
        ticketEstimatedHours: { with: false, without: false },
        ticketCompletedHours: { with: false, without: false },
    });

    // Extraer datos únicos para los filtros
    const uniqueAssignedUsers = Array.from(new Set(contextUserStories.map((story) => story.assignedTo || 'No asignado')));
    // Función para normalizar el formato de los tags
    const formatTag = (tag: string) => {
        return tag
            .trim()
            .toLowerCase()
            .replace(/\b\w/g, (char: string) => char.toUpperCase());
    };
    // Extraer todos los tags únicos y normalizarlos
    const uniqueTag = Array.from(
        new Set(
            contextUserStories.flatMap((story) => {
                if (!story.tags) return ['Sin etiquetas']; // Si no hay tags, devuelve un valor por defecto
                if (Array.isArray(story.tags)) {
                    return story.tags.map(formatTag); // Aplica `formatTag` a cada tag
                }
                return [formatTag(story.tags)]; // Si es un solo tag, aplícalo directamente
            })
        )
    ).sort();
    const uniqueState = Array.from(new Set(contextUserStories.map((story) => story.state || 'No asignado')));
    const uniqueDates = Array.from(new Set(contextUserStories.map(story => story.dueDate).filter(Boolean))).sort() as string[];
    const uniqueTicketState = Array.from(new Set(contextIncompleteTickets.map((ticket) => ticket.state || 'No asignado')));
    const uniqueTicketTypes = Array.from(new Set(contextIncompleteTickets.map(ticket => ticket.type || 'No especificado')));
    const uniqueTicketAssignedUsers = Array.from(new Set(contextIncompleteTickets.map((ticket) => ticket.assignedTo || 'No asignado'))).sort();

    // Filtrar User Stories usando useMemo para optimización
    const filteredStories = useMemo(() => {
        if (!Array.isArray(contextUserStories)) return [];

        let filtered = [...contextUserStories];

        if (filters.description.with) {
            filtered = filtered.filter((story) => story.description);
        }
        if (filters.description.without) {
            filtered = filtered.filter((story) => !story.description);
        }
        if (filters.acceptanceCriteria.with) {
            filtered = filtered.filter((story) => story.acceptance_criteria);
        }
        if (filters.acceptanceCriteria.without) {
            filtered = filtered.filter((story) => !story.acceptance_criteria);
        }
        if (filters.storyPoints.with) {
            filtered = filtered.filter((story) => typeof story.storyPoints === "number" && story.storyPoints > 0);
        }
        if (filters.storyPoints.without) {
            filtered = filtered.filter((story) => typeof story.storyPoints !== "number" || story.storyPoints <= 0);
        }
        if (filters.assignedTo) {
            if (filters.assignedTo.toLowerCase() === "no asignado") {
                filtered = filtered.filter((story) => !story.assignedTo || story.assignedTo === '');
            } else {
                filtered = filtered.filter((story) => story.assignedTo === filters.assignedTo);
            }
        }
        // Filtro por tags
        if (filters.tags.length > 0) {
            filtered = filtered.filter((story) => {
                // Si `story.tags` es falsy, retorna false
                if (!story.tags) return false;

                // Si `story.tags` es un string, normalízalo
                if (typeof story.tags === 'string') {
                    const normalizedTag = (story.tags as string)
                        .trim()
                        .toLowerCase()
                        .replace(/\b\w/g, (char: string) => char.toUpperCase());

                    return filters.tags.includes(normalizedTag);
                }

                // Si `story.tags` es un array, normaliza cada elemento
                if (Array.isArray(story.tags)) {
                    const formattedTags = story.tags
                        .filter((tag): tag is string => typeof tag === 'string') // Asegura que `tag` es un string
                        .map(tag => tag.trim().toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase()));

                    return filters.tags.some(tag => formattedTags.includes(tag));
                }

                return false;
            });
        }

        if (filters.state) {
            filtered = filtered.filter((story) => story.state === filters.state);
        }
        if (filters.dueDate.length > 0 && !filters.dueDate.includes("Todos")) {
            filtered = filtered.filter(story => {
                if (!story.dueDate) return false;
                const normalizedDueDate = story.dueDate.split('T')[0];
                const normalizedSelectedDates = filters.dueDate.map(date => date.split('T')[0]);
                return normalizedSelectedDates.includes(normalizedDueDate);
            });
        }

        return filtered;
    }, [contextUserStories, filters]);

    // Filtrar Otros Tickets usando useMemo para optimización
    const filteredTickets = useMemo(() => {
        if (!Array.isArray(contextIncompleteTickets)) return [];

        let filtered = [...contextIncompleteTickets];

        if (filters.ticketState.length > 0) {
            filtered = filtered.filter((ticket) => filters.ticketState.includes(ticket.state));
        }
        if (filters.ticketAssignedTo) {
            if (filters.ticketAssignedTo.toLowerCase() === 'no asignado') {
                filtered = filtered.filter((ticket) => !ticket.assignedTo || ticket.assignedTo === '');
            } else {
                filtered = filtered.filter((ticket) => ticket.assignedTo === filters.ticketAssignedTo);
            }
        }
        if (filters.ticketType.length > 0) {
            filtered = filtered.filter((ticket) => filters.ticketType.includes(ticket.type));
        }
        if (filters.ticketDescription.with) {
            filtered = filtered.filter((ticket) => ticket.description && ticket.description.trim() !== '');
        }
        if (filters.ticketDescription.without) {
            filtered = filtered.filter((ticket) => !ticket.description || ticket.description.trim() === '');
        }
        if (filters.ticketEstimatedHours.with) {
            filtered = filtered.filter(ticket => ticket.estimated_hours && Number(ticket.estimated_hours) > 0);
        }
        if (filters.ticketEstimatedHours.without) {
            filtered = filtered.filter(ticket => !ticket.estimated_hours || Number(ticket.estimated_hours) <= 0);
        }
        if (filters.ticketCompletedHours.with) {
            filtered = filtered.filter(ticket => ticket.completed_hours && Number(ticket.completed_hours) > 0);
        }
        if (filters.ticketCompletedHours.without) {
            filtered = filtered.filter(ticket => !ticket.completed_hours || Number(ticket.completed_hours) <= 0);
        }

        return filtered;
    }, [contextIncompleteTickets, filters]);

    return (
        <div className="min-h-screen bg-white">
            <Header showBackButton />
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold text-[#2461b3] mb-8">Tickets Incompletos</h1>

                    {/* Tabs y botón de exportación */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setSelectedTab('userStories')}
                                className={`px-4 py-2 rounded ${selectedTab === 'userStories' ? 'bg-[#2461b3] text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                                User Stories
                            </button>
                            <button
                                onClick={() => setSelectedTab('otherTickets')}
                                className={`px-4 py-2 rounded ${selectedTab === 'otherTickets' ? 'bg-[#2461b3] text-white' : 'bg-gray-200 text-gray-800'}`}
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
                        <UserStoriesTable
                            filteredStories={filteredStories}
                            filters={filters}
                            setFilters={setFilters}
                            uniqueAssignedUsers={uniqueAssignedUsers}
                            uniqueTag={uniqueTag}
                            uniqueState={uniqueState}
                            uniqueDates={uniqueDates}
                        />
                    )}

                    {/* Tabla de Otros Tickets */}
                    {selectedTab === 'otherTickets' && !loading && !error && (
                        <OtherTicketsTable
                            filteredTickets={filteredTickets}
                            filters={filters}
                            setFilters={setFilters}
                            uniqueTicketState={uniqueTicketState}
                            uniqueTicketTypes={uniqueTicketTypes}
                            uniqueTicketAssignedUsers={uniqueTicketAssignedUsers}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default IncompleteTickets;