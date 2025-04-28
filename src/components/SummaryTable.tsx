import React from 'react';
import Skeleton from './common/Skeleton';
import { profiles } from '../utils/profilesData';
import { ponderaciones } from '../utils/ponderacionesData';

interface Ticket {
    id: number;
    assignedTo: string | { displayName: string };
    completed_hours?: number;
    estimated_hours?: number;
    new_estimate?: number; 
    child_work_items?: Ticket[];
}

interface SummaryTableProps {
    tickets: Ticket[];
    totalEffort: {
        completed: number;
        estimated: number;
        corrected: number;
        weighted: number;
        team: number;
    };
}

const SummaryTable: React.FC<SummaryTableProps> = ({ tickets, totalEffort }) => {
    const [profileHours, setProfileHours] = React.useState<any[]>([]);
    const [totalProgress, setTotalProgress] = React.useState(0);
    const [loading, setLoading] = React.useState(true);

    // Cálculos memorizados con nombres normalizados
    const ticketAssignments = React.useMemo(() => 
        tickets.reduce((acc, ticket) => {
            const assignee = typeof ticket.assignedTo === 'string' 
                ? ticket.assignedTo 
                : ticket.assignedTo?.displayName;
            acc[assignee] = (acc[assignee] || 0) + (Number(ticket.estimated_hours) || 0);
            return acc;
        }, {} as Record<string, number>),
    [tickets]);

    const completedTicketAssignments = React.useMemo(() => 
        tickets.reduce((acc, ticket) => {
            const assignee = typeof ticket.assignedTo === 'string' 
                ? ticket.assignedTo 
                : ticket.assignedTo?.displayName;
            const hours = Number(ticket.completed_hours) || 0;
            acc[assignee] = (acc[assignee] || 0) + hours;
            return acc;
        }, {} as Record<string, number>),
    [tickets]);

    const weightedTicketAssignments = React.useMemo(() => 
        tickets.reduce((acc, ticket) => {
            const assignee = typeof ticket.assignedTo === 'string' 
                ? ticket.assignedTo 
                : ticket.assignedTo?.displayName;
            const estimate = ticket.completed_hours ?? 0;
            const factor = ponderaciones[assignee] || 1;
            acc[assignee] = (acc[assignee] || 0) + (Number(estimate) * factor);
            return acc;
        }, {} as Record<string, number>),
    [tickets]);

    const correctedTicketAssignments = React.useMemo(() => 
        tickets.reduce((acc, ticket) => {
            const assignee = typeof ticket.assignedTo === 'string' 
                ? ticket.assignedTo 
                : ticket.assignedTo?.displayName;
            const estimate = ticket.new_estimate ?? ticket.estimated_hours ?? 0;
            acc[assignee] = (acc[assignee] || 0) + Number(estimate);
            return acc;
        }, {} as Record<string, number>),
    [tickets]);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // Calcular todo localmente sin API
            const profileData = profiles.map((profile) => {
                const teamEstimate = profile.assignedNames.reduce(
                    (sum, name) => sum + (ticketAssignments[name] || 0),
                    0
                );

                const localHours = profile.assignedNames.reduce(
                    (sum, name) => sum + (completedTicketAssignments[name] || 0),
                    0
                );

                const weightedEstimate = profile.assignedNames.reduce(
                    (sum, name) => sum + (weightedTicketAssignments[name] || 0),
                    0
                );

                const correctedEstimate = profile.assignedNames.reduce(
                    (sum, name) => sum + (correctedTicketAssignments[name] || 0),
                    0
                );

                const progress = ((weightedEstimate / profile.estimatedHours) * 100)
                    .toLocaleString('es-ES', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    }) + "%";

                return {
                    role: profile.role,
                    estimatedHours: profile.estimatedHours,
                    completedHours: localHours,
                    teamEstimate,
                    correctedEstimate,
                    weightedEstimate,
                    progress
                };
            });

            // Calcular progreso total basado en datos locales
            const totalCompleted = profileData.reduce((sum, p) => sum + p.completedHours, 0);
            const totalEstimated = profileData.reduce((sum, p) => sum + p.estimatedHours, 0);
            
            setProfileHours(profileData);
            setTotalProgress((totalCompleted / totalEstimated) * 100);
            setLoading(false);
        };
        
        fetchData();
    }, [tickets]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-4">
                <p className="text-blue-800 animate-pulse">Cargando resumen...</p>
            </div>
        );
    }
    
    return (
        <div className="mb-4 p-3 bg-white shadow rounded-lg">
            <table className="w-full table-auto border-collapse border border-gray-200 text-sm">
                <thead>
                    <tr className="bg-blue-50 text-lg">
                        <th className="p-1 text-left font-semibold text-blue-800">Recursos</th>
                        <th className="p-1 text-left font-semibold text-blue-800">Hs Presupuestadas</th>
                        <th className="p-1 text-left font-semibold text-blue-800">Est. Equipo</th>
                        <th className="p-1 text-left font-semibold text-blue-800">Est. Corregida​</th>
                        <th className="p-1 text-left font-semibold text-blue-800">Hs Reales</th>
                        <th className="p-1 text-left font-semibold text-blue-800">Hs Ponderadas</th>
                        <th className="p-1 text-left font-semibold text-blue-800">% Horas Consumidas</th>
                    </tr>
                </thead>
                <tbody>
                    {profileHours.map((profile) => (
                        <tr key={profile.role} className="border-t border-gray-200">
                            <td className="p-1">{profile.role}</td>
                            <td className="p-1">
                                {loading ? <Skeleton /> : profile.estimatedHours.toLocaleString()}
                            </td>
                            <td className="p-1">
                                {loading ? <Skeleton /> : profile.teamEstimate.toLocaleString()}
                            </td>
                            <td className="p-1">
                                {loading ? <Skeleton /> : profile.correctedEstimate.toLocaleString()}
                            </td>
                            <td className="p-1">
                                {loading ? <Skeleton /> : profile.completedHours.toLocaleString()}
                            </td>
                            <td className="p-1">
                                {loading ? <Skeleton /> : profile.weightedEstimate?.toLocaleString()}
                            </td>
                            <td className="p-1">
                                {loading ? <Skeleton /> : profile.progress}
                            </td>
                        </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-black bg-gray-100">
                        <td className="p-1">Total</td>
                        <td className="p-1">{totalEffort.estimated.toLocaleString()}</td>
                        <td className="p-1">{totalEffort.team.toLocaleString()}</td>
                        <td className="p-1">{totalEffort.corrected.toLocaleString()}</td>
                        <td className="p-1">{totalEffort.completed.toLocaleString()}</td>
                        <td className="p-1">{totalEffort.weighted.toLocaleString()}</td>
                        <td className="p-1">{totalProgress.toFixed(2).replace('.', ',')}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default SummaryTable;