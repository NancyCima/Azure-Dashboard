import { useState } from 'react';
import { ArrowUpDown, Filter} from 'lucide-react';
import { WorkItem } from '../services/api';
import { useClickOutside } from '../hooks/useClickOutside';
import { CompletionIndicator} from '../components/common/CompletionIndicator';
import { WorkItemLink} from '../components/common/WorkItemLink';
import { formatDate } from '../utils/dateUtils';

// componente utilizado en la pagina de Incomplete Tickets

interface UserStoriesTableProps {
    filteredStories: WorkItem[];
    filters: any;
    setFilters: (filters: any) => void;
    uniqueAssignedUsers: string[];
    uniqueTag: string[];
    uniqueState: string[];
    uniqueDates: string[];
}

const UserStoriesTable: React.FC<UserStoriesTableProps> = ({
    filteredStories,
    filters,
    setFilters,
    uniqueAssignedUsers,
    uniqueTag,
    uniqueState,
    uniqueDates,
}) => {
    // Estados y referencias para los filtros
    const { isOpen: isDescriptionFilterOpen, setIsOpen: setIsDescriptionFilterOpen, ref: descriptionFilterRef } = useClickOutside(false);
    const { isOpen: isCriteriaFilterOpen, setIsOpen: setIsCriteriaFilterOpen, ref: criteriaFilterRef } = useClickOutside(false);
    const { isOpen: isStoryPointsFilterOpen, setIsOpen: setIsStoryPointsFilterOpen, ref: storyPointsFilterRef } = useClickOutside(false);
    const { isOpen: isAssignedFilterOpen, setIsOpen: setIsAssignedFilterOpen, ref: assignedFilterRef } = useClickOutside(false);
    const { isOpen: isTagFilterOpen, setIsOpen: setIsTagFilterOpen, ref: tagFilterRef } = useClickOutside(false);
    const { isOpen: isStateFilterOpen, setIsOpen: setIsStateFilterOpen, ref: stateFilterRef } = useClickOutside(false);
    const { isOpen: isDateFilterOpen, setIsOpen: setIsDateFilterOpen, ref: dateFilterRef } = useClickOutside(false);
     // Estado para manejar el orden de la fecha de entrega
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
 
     // Ordenar las historias según la fecha de entrega
     const sortedStories = [...filteredStories].sort((a, b) => {
         if (!a.dueDate || !b.dueDate) return 0;
         return sortOrder === 'asc'
             ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
             : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
     });
 
    return (
        <div className="px-6 mx-auto flex justify-center">
            <table className="bg-white border border-gray-200 rounded-lg shadow-sm w-full">
                <thead>
                    <tr className="bg-blue-50">
                        {/* Columna ID */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[100px]">
                            <div className="flex items-center justify-between">
                                <span>ID</span>
                            </div>
                        </th>

                        {/* Columna Título */}
                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800 w-[200px]">
                            <div className="flex items-center justify-between">
                                <span>Título</span>
                            </div>
                        </th>

                        {/* Columna Descripción */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Descripción</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.description.with || filters.description.without ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsDescriptionFilterOpen(!isDescriptionFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isDescriptionFilterOpen && (
                                <div ref={descriptionFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, description: { with: false, without: false } });
                                            setIsDescriptionFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, description: { with: true, without: false } });
                                            setIsDescriptionFilterOpen(false);
                                        }}
                                    >
                                        Con descripción
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, description: { with: false, without: true } });
                                            setIsDescriptionFilterOpen(false);
                                        }}
                                    >
                                        Sin descripción
                                    </button>
                                </div>
                            )}
                        </th>

                        {/* Columna Criterios de Aceptación */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Criterios de Aceptación</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.acceptanceCriteria.with || filters.acceptanceCriteria.without ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsCriteriaFilterOpen(!isCriteriaFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isCriteriaFilterOpen && (
                                <div ref={criteriaFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, acceptanceCriteria: { with: false, without: false } });
                                            setIsCriteriaFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, acceptanceCriteria: { with: true, without: false } });
                                            setIsCriteriaFilterOpen(false);
                                        }}
                                    >
                                        Con criterios
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, acceptanceCriteria: { with: false, without: true } });
                                            setIsCriteriaFilterOpen(false);
                                        }}
                                    >
                                        Sin criterios
                                    </button>
                                </div>
                            )}
                        </th>

                        {/* Columna Story Points */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Story Points</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.storyPoints.with || filters.storyPoints.without ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsStoryPointsFilterOpen(!isStoryPointsFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isStoryPointsFilterOpen && (
                                <div ref={storyPointsFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, storyPoints: { with: false, without: false } });
                                            setIsStoryPointsFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, storyPoints: { with: true, without: false } });
                                            setIsStoryPointsFilterOpen(false);
                                        }}
                                    >
                                        Con Story Points
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, storyPoints: { with: false, without: true } });
                                            setIsStoryPointsFilterOpen(false);
                                        }}
                                    >
                                        Sin Story Points
                                    </button>
                                </div>
                            )}
                        </th>

                        {/* Columna Estado */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Estado</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.state ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsStateFilterOpen(!isStateFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isStateFilterOpen && (
                                <div ref={stateFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, state: '' });
                                            setIsStateFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    {uniqueState.map(state => (
                                        <button
                                            key={state}
                                            className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                            onClick={() => {
                                                setFilters({ ...filters, state });
                                                setIsStateFilterOpen(false);
                                            }}
                                        >
                                            {state}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </th>

                        {/* Columna Asignado */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Asignado</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.assignedTo ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsAssignedFilterOpen(!isAssignedFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isAssignedFilterOpen && (
                                <div ref={assignedFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, assignedTo: '' });
                                            setIsAssignedFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    {uniqueAssignedUsers.map(user => (
                                        <button
                                            key={user}
                                            className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                            onClick={() => {
                                                setFilters({ ...filters, assignedTo: user });
                                                setIsAssignedFilterOpen(false);
                                            }}
                                        >
                                            {user}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </th>

                        {/* Columna Tags */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Tags</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.tags.length > 0 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsTagFilterOpen(!isTagFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isTagFilterOpen && (
                                <div ref={tagFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, tags: [] });
                                            setIsTagFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    {uniqueTag.map(tag => (
                                        <button
                                            key={tag}
                                            className={`block w-full text-left px-2 py-1 ${filters.tags.includes(tag) ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
                                            onClick={() => {
                                                setFilters((prev: any) => ({
                                                    ...prev,
                                                    tags: prev.tags.includes(tag) ? prev.tags.filter((t: string) => t !== tag) : [...prev.tags, tag],
                                                }));
                                            }}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </th>

                        {/* Columna Fecha de Entrega */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Fecha de Entrega</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.dueDate.length > 0 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                                <button
                                    className="ml-2 text-gray-600 hover:text-blue-600"
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                >
                                    <ArrowUpDown className="w-4 h-4 inline-block" />
                                </button>
                            </div>
                            {isDateFilterOpen && (
                                <div ref={dateFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, dueDate: [] });
                                            setIsDateFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    {uniqueDates.map(date => (
                                        <button
                                            key={date}
                                            className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                            onClick={() => {
                                                setFilters({ ...filters, dueDate: [date] });
                                                setIsDateFilterOpen(false);
                                            }}
                                        >
                                            {formatDate(date)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sortedStories.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="px-6 py-4 text-center text-blue-800 bg-blue-50">
                                No hay user stories que coincidan con los filtros aplicados.
                            </td>
                        </tr>
                    ) : (
                        sortedStories.map((story) => (
                            <tr key={story.id} className="hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-blue-800 w-[100px]">
                                    <div className="flex items-center">
                                        #{story.id}
                                        <WorkItemLink url={story.work_item_url} />
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-gray-700 w-[200px]">{story.title}</td>
                                <td className="px-6 py-4 w-[150px]">
                                    <CompletionIndicator isComplete={Boolean(story.description)} />
                                </td>
                                <td className="px-6 py-4 w-[150px]">
                                    <CompletionIndicator isComplete={Boolean(story.acceptance_criteria)} />
                                </td>
                                <td className="px-6 py-4 w-[150px]">
                                    <CompletionIndicator isComplete={typeof story.storyPoints === "number" && story.storyPoints > 0} />
                                </td>
                                <td className="px-6 py-4 text-gray-700 w-[150px]">{story.state}</td>
                                <td className="px-6 py-4 text-gray-700 w-[150px]">{story.assignedTo || 'No asignado'}</td>
                                <td className="px-6 py-4 text-gray-700 w-[150px]">
                                    {!story.tags ? 'Sin etiquetas' : Array.isArray(story.tags) ? story.tags.join(', ') : story.tags}
                                </td>
                                <td className="px-6 py-4 text-gray-700 w-[150px]">{formatDate(story.dueDate)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default UserStoriesTable;