import { Filter } from 'lucide-react';
import { WorkItem } from '../services/api';
import { useClickOutside } from '../hooks/useClickOutside';
import { CompletionIndicator} from '../components/common/CompletionIndicator';
import { WorkItemLink} from '../components/common/WorkItemLink';

// componente utilizado en la pagina de Incomplete Tickets

interface OtherTicketsTableProps {
    filteredTickets: WorkItem[];
    filters: any;
    setFilters: (filters: any) => void;
    uniqueTicketState: string[];
    uniqueTicketTypes: string[];
    uniqueTicketAssignedUsers: string[];
}

const OtherTicketsTable: React.FC<OtherTicketsTableProps> = ({
    filteredTickets,
    filters,
    setFilters,
    uniqueTicketState,
    uniqueTicketTypes,
    uniqueTicketAssignedUsers,
}) => {
    // Estados y referencias para los filtros
    const { isOpen: isTicketStateFilterOpen, setIsOpen: setIsTicketStateFilterOpen, ref: ticketStateFilterRef } = useClickOutside(false);
    const { isOpen: isTicketTypeFilterOpen, setIsOpen: setIsTicketTypeFilterOpen, ref: ticketTypeFilterRef } = useClickOutside(false);
    const { isOpen: isTicketAssignedFilterOpen, setIsOpen: setIsTicketAssignedFilterOpen, ref: ticketAssignedFilterRef } = useClickOutside(false);
    const { isOpen: isTicketDescriptionFilterOpen, setIsOpen: setIsTicketDescriptionFilterOpen, ref: ticketDescriptionFilterRef } = useClickOutside(false);
    const { isOpen: isEstimatedHoursFilterOpen, setIsOpen: setIsEstimatedHoursFilterOpen, ref: estimatedHoursFilterRef } = useClickOutside(false);
    const { isOpen: isCompletedHoursFilterOpen, setIsOpen: setIsCompletedHoursFilterOpen, ref: completedHoursFilterRef } = useClickOutside(false);

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

                        {/* Columna Tipo de Ticket */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Tipo de Ticket</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.ticketType.length > 0 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsTicketTypeFilterOpen(!isTicketTypeFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isTicketTypeFilterOpen && (
                                <div ref={ticketTypeFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketType: [] });
                                            setIsTicketTypeFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    {uniqueTicketTypes.map(type => (
                                        <button
                                            key={type}
                                            className={`block w-full text-left px-2 py-1 ${filters.ticketType.includes(type) ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
                                            onClick={() => {
                                                setFilters((prev: any) => ({
                                                    ...prev,
                                                    ticketType: prev.ticketType.includes(type) ? prev.ticketType.filter((t: string) => t !== type) : [...prev.ticketType, type],
                                                }));
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </th>

                        {/* Columna Estado */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Estado</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.ticketState.length > 0 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsTicketStateFilterOpen(!isTicketStateFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isTicketStateFilterOpen && (
                                <div ref={ticketStateFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketState: [] });
                                            setIsTicketStateFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    {uniqueTicketState.map(state => (
                                        <button
                                            key={state}
                                            className={`block w-full text-left px-2 py-1 ${filters.ticketState.includes(state) ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
                                            onClick={() => {
                                                setFilters((prev: any) => ({
                                                    ...prev,
                                                    ticketState: prev.ticketState.includes(state) ? prev.ticketState.filter((s: string) => s !== state) : [...prev.ticketState, state],
                                                }));
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
                                    className={`ml-2 p-1 border rounded ${filters.ticketAssignedTo ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsTicketAssignedFilterOpen(!isTicketAssignedFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isTicketAssignedFilterOpen && (
                                <div ref={ticketAssignedFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketAssignedTo: '' });
                                            setIsTicketAssignedFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    {uniqueTicketAssignedUsers.map(user => (
                                        <button
                                            key={user}
                                            className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                            onClick={() => {
                                                setFilters({ ...filters, ticketAssignedTo: user });
                                                setIsTicketAssignedFilterOpen(false);
                                            }}
                                        >
                                            {user}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </th>

                        {/* Columna Descripción */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Descripción</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.ticketDescription.with || filters.ticketDescription.without ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsTicketDescriptionFilterOpen(!isTicketDescriptionFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isTicketDescriptionFilterOpen && (
                                <div ref={ticketDescriptionFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketDescription: { with: false, without: false } });
                                            setIsTicketDescriptionFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketDescription: { with: true, without: false } });
                                            setIsTicketDescriptionFilterOpen(false);
                                        }}
                                    >
                                        Con descripción
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketDescription: { with: false, without: true } });
                                            setIsTicketDescriptionFilterOpen(false);
                                        }}
                                    >
                                        Sin descripción
                                    </button>
                                </div>
                            )}
                        </th>

                        {/* Columna Estimación (Horas) */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Estimación (Horas)</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.ticketEstimatedHours.with || filters.ticketEstimatedHours.without ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsEstimatedHoursFilterOpen(!isEstimatedHoursFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isEstimatedHoursFilterOpen && (
                                <div ref={estimatedHoursFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketEstimatedHours: { with: false, without: false } });
                                            setIsEstimatedHoursFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketEstimatedHours: { with: true, without: false } });
                                            setIsEstimatedHoursFilterOpen(false);
                                        }}
                                    >
                                        Con estimación
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketEstimatedHours: { with: false, without: true } });
                                            setIsEstimatedHoursFilterOpen(false);
                                        }}
                                    >
                                        Sin estimación
                                    </button>
                                </div>
                            )}
                        </th>

                        {/* Columna Horas Completadas */}
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800 w-[150px]">
                            <div className="flex items-center justify-between">
                                <span>Horas Completadas</span>
                                <button
                                    className={`ml-2 p-1 border rounded ${filters.ticketCompletedHours.with || filters.ticketCompletedHours.without ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:border-blue-500'}`}
                                    onClick={() => setIsCompletedHoursFilterOpen(!isCompletedHoursFilterOpen)}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            {isCompletedHoursFilterOpen && (
                                <div ref={completedHoursFilterRef} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-48">
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketCompletedHours: { with: false, without: false } });
                                            setIsCompletedHoursFilterOpen(false);
                                        }}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketCompletedHours: { with: true, without: false } });
                                            setIsCompletedHoursFilterOpen(false);
                                        }}
                                    >
                                        Con horas completadas
                                    </button>
                                    <button
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            setFilters({ ...filters, ticketCompletedHours: { with: false, without: true } });
                                            setIsCompletedHoursFilterOpen(false);
                                        }}
                                    >
                                        Sin horas completadas
                                    </button>
                                </div>
                            )}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {filteredTickets.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-6 py-4 text-center text-blue-800 bg-blue-50">
                                No hay tickets que coincidan con los filtros aplicados.
                            </td>
                        </tr>
                    ) : (
                        filteredTickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-blue-800 w-[100px]">
                                    <div className="flex items-center">
                                        #{ticket.id}
                                        <WorkItemLink url={ticket.work_item_url} />
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-gray-700 w-[200px]">{ticket.title}</td>
                                <td className="px-6 py-4 text-gray-700 w-[150px]">{ticket.type}</td>
                                <td className="px-6 py-4 text-gray-700 w-[150px]">{ticket.state}</td>
                                <td className="px-6 py-4 text-gray-700 w-[150px]">{ticket.assignedTo || 'No asignado'}</td>
                                <td className="px-6 py-4 w-[150px]">
                                    <CompletionIndicator isComplete={Boolean(ticket.description)} />
                                </td>
                                <td className="px-6 py-4 w-[150px]">
                                    <CompletionIndicator isComplete={typeof ticket.estimated_hours === "number" && ticket.estimated_hours > 0} />
                                </td>
                                <td className="px-6 py-4 w-[150px]">
                                    <CompletionIndicator isComplete={typeof ticket.completed_hours === "number" && ticket.completed_hours > 0} />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default OtherTicketsTable;