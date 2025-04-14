import React from 'react';
import { api } from '../services/api';
import Skeleton from './common/Skeleton';
import { profiles } from '../utils/profilesData';
import { ponderaciones } from '../utils/ponderacionesData';

// Interfaz del ticket
interface Ticket {
    id: number;
    assignedTo: string | { displayName: string };
    completedHours: number | string | undefined;
    estimated_hours?: number;
    new_estimate?: number; 
}

// Interfaz de Props
interface SummaryTableProps {
    tickets: Ticket[];
}

const SummaryTable: React.FC<SummaryTableProps> = ({ tickets }) => {
    const [profileHours, setProfileHours] = React.useState<any[]>([]);
    const [totalEstimated, setTotalEstimated] = React.useState(0);
    const [totalCompleted, setTotalCompleted] = React.useState(0);
    const [totalTeamEstimate, setTotalTeamEstimate] = React.useState(0);
    const [totalCorrectedEstimate, setTotalCorrectedEstimate] = React.useState(0);
    const [totalWeighted, setTotalWeighted] = React.useState(0);
    const [totalProgress, setTotalProgress] = React.useState(0);
    const [loading, setLoading] = React.useState(true);

    // Memorizar cálculos pesados
    const ticketAssignments = React.useMemo(() => 
        tickets.reduce((acc, ticket) => {
            const assignee = typeof ticket.assignedTo === 'string' 
                ? ticket.assignedTo 
                : ticket.assignedTo?.displayName;
            acc[assignee] = (acc[assignee] || 0) + (Number(ticket.estimated_hours) || 0);
            return acc;
        }, {} as Record<string, number>),
    [tickets]);

    const weightedTicketAssignments = React.useMemo(() => 
        tickets.reduce((acc, ticket) => {
          const assignee = typeof ticket.assignedTo === 'string' 
            ? ticket.assignedTo 
            : ticket.assignedTo?.displayName;
          const estimate = ticket.completedHours ?? 0;
          const factor = ponderaciones[assignee] || 1;
          acc[assignee] = (acc[assignee] || 0) + (Number(estimate) * factor);
          return acc;
        }, {} as Record<string, number>),
      [tickets]);

    // Estimaciones corregidas
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
            setLoading(true); // Mostrar loader mientras se cargan los datos

            //Paralelizar operaciones async
            // Calcular horas completadas por perfil
            const profileData = await Promise.all(
                profiles.map(async (profile) => {
                    const [completedHours] = await Promise.all([
                        api.getTotalesRealesPorAsignados(profile.assignedNames),
                    ]);
                    const weightedEstimate = profile.assignedNames.reduce(
                        (sum, name) => sum + (weightedTicketAssignments[name] || 0),
                        0
                    );

                // Estimación del equipo: suma de estimated_hours de los tickets asignados
                // (sync - optimizado)
                const teamEstimate = profile.assignedNames.reduce(
                    (sum, name) => sum + (ticketAssignments[name] || 0),
                    0
                );

                // Estimación corregida: suma de new_estimate de los tickets asignados
                const correctedEstimate = profile.assignedNames.reduce(
                    (sum, name) => sum + (correctedTicketAssignments[name] || 0),
                    0
                );

                // Progreso: Se usa solo las horas hardcodeadas para el % de avance
                const progress = ((weightedEstimate / profile.estimatedHours) * 100)
                .toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

                return {
                    role: profile.role,
                    estimatedHours: profile.estimatedHours, // Usa las horas hardcodeadas
                    completedHours: completedHours,         // Suma real de las horas completadas
                    teamEstimate: teamEstimate,             // Estimación Equipo
                    correctedEstimate: correctedEstimate,
                    weightedEstimate: weightedEstimate,
                    progress: progress
                };
            }));
    
            // Calcular totales CON LOS DATOS ACTUALES (no con profileHours)
            const totals = profileData.reduce((acc, profile) => ({
                estimated: acc.estimated + profile.estimatedHours,
                completed: acc.completed + profile.completedHours,
                team: acc.team + profile.teamEstimate,
                corrected: acc.corrected + profile.correctedEstimate,
                weighted: acc.weighted + profile.weightedEstimate
            }), { estimated: 0, completed: 0, team: 0, corrected: 0, weighted: 0 });

            // Actualizar los estados
            setProfileHours(profileData);
            setTotalEstimated(totals.estimated);
            setTotalCompleted(totals.completed);
            setTotalTeamEstimate(totals.team);
            setTotalCorrectedEstimate(totals.corrected);
            setTotalWeighted(totals.weighted);
            setTotalProgress((totals.completed / totals.estimated) * 100);
            setLoading(false); // Ocultar loader cuando los datos estén listos
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
                        <td className="p-1">{totalEstimated.toLocaleString()}</td>
                        <td className="p-1">{totalTeamEstimate.toLocaleString()}</td>
                        <td className="p-1">{totalCorrectedEstimate.toLocaleString()}</td>
                        <td className="p-1">{totalCompleted.toLocaleString()}</td>
                        <td className="p-1">{totalWeighted.toLocaleString()}</td>
                        <td className="p-1">{totalProgress.toFixed(2).replace('.', ',')}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default SummaryTable;