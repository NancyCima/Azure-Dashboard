import React from 'react';
import Skeleton from './common/Skeleton';
import { profiles } from '../utils/profilesData';
import { ponderaciones } from '../utils/ponderacionesData';

interface Ticket {
    id: number;
    assignedTo: string | { displayName: string };
    completed_hours?: number;
    estimated_hours?: number;
    new_estimate?: number | string; 
    child_work_items?: Ticket[];
}

interface SummaryTableProps {
    tickets: Ticket[];
}

interface ProfileData {
    role: string;
    estimatedHours: number;
    teamEstimate: number;
    correctedEstimate: number;
    completedHours: number;
    weightedHours: number;
    progress: string;
}

interface TableData {
    profiles: ProfileData[];
    totals: {
        estimatedHours: number;
        teamEstimate: number;
        correctedEstimate: number;
        completedHours: number;
        weightedHours: number;
    };
    totalProgress: number;
}

const SummaryTable: React.FC<SummaryTableProps> = ({ tickets }) => {
    const [tableData, setTableData] = React.useState<TableData | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // Tickets no asignados
            const unassignedTickets = tickets.filter(ticket => {
                const assignee = typeof ticket.assignedTo === 'string' 
                    ? ticket.assignedTo 
                    : ticket.assignedTo?.displayName;
                const isParent = (ticket.child_work_items?.length ?? 0) > 0;
                return !assignee && !isParent;
            });
        
            // Calcular métricas para no asignados
            const unassignedMetrics = unassignedTickets.reduce(
                (acc, ticket) => ({
                teamEstimate: acc.teamEstimate + (Number(ticket.estimated_hours ?? 0) || 0),
                completedHours: acc.completedHours + (Number(ticket.completed_hours) || 0),
                correctedEstimate: acc.correctedEstimate + (
                    // Validación robusta para new_estimate
                    ticket.new_estimate !== null &&
                    ticket.new_estimate !== undefined &&
                    ticket.new_estimate !== "" &&
                    !isNaN(Number(ticket.new_estimate))
                        ? Number(ticket.new_estimate)
                        : (Number(ticket.estimated_hours) || 0) // Fallback a estimated_hours
                ),
                weightedHours: acc.weightedHours + ((Number(ticket.completed_hours) || 0) * 1) // Sin ponderación
                }),
                { teamEstimate: 0, completedHours: 0, correctedEstimate: 0, weightedHours: 0 }
            );
            
            const profileData = profiles.map((profile) => {
                // Filtrar tickets por los nombres asignados al perfil
                const profileTickets = tickets.filter(ticket => {
                    const assignee = typeof ticket.assignedTo === 'string' 
                        ? ticket.assignedTo 
                        : ticket.assignedTo?.displayName;
                    return profile.assignedNames.includes(assignee || '');
                });

                // Calcular horas estimadas y completadas para el perfil
                const { teamEstimate, completedHours, correctedEstimate, weightedHours } = profileTickets.reduce(
                    (acc, ticket) => {
                        const assignee = typeof ticket.assignedTo === 'string' 
                            ? ticket.assignedTo 
                            : ticket.assignedTo?.displayName;
                        const factor = ponderaciones[assignee || ''] || 1;

                        // Solo considerar tickets que no son User Stories
                        if (ticket.child_work_items && ticket.child_work_items.length > 0) {
                            return acc;
                        }
                        
                        return {
                            teamEstimate: acc.teamEstimate + (Number(ticket.estimated_hours) || 0),
                            completedHours: acc.completedHours + (Number(ticket.completed_hours) || 0),
                            correctedEstimate: acc.correctedEstimate + (
                                ticket.new_estimate !== null && 
                                ticket.new_estimate !== undefined && 
                                ticket.new_estimate !== "" &&
                                !isNaN(Number(ticket.new_estimate))
                                    ? Number(ticket.new_estimate)
                                    : (Number(ticket.estimated_hours) || 0)
                            ),
                            weightedHours: acc.weightedHours + ((Number(ticket.completed_hours) || 0) * factor)
                        };
                    },
                    { teamEstimate: 0, completedHours: 0, correctedEstimate: 0, weightedHours: 0 }
                );

                const progress = profile.estimatedHours > 0
                    ? ((weightedHours / profile.estimatedHours) * 100)
                        .toLocaleString('es-ES', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                        }) + "%"
                    : "0.00%";

                return {
                    role: profile.role,
                    estimatedHours: profile.estimatedHours,
                    teamEstimate,
                    correctedEstimate,
                    completedHours,
                    weightedHours,
                    progress
                };
            });

            // Agregar fila de no asignados
            profileData.push({
                role: 'No asignado',
                estimatedHours: 0,
                teamEstimate: unassignedMetrics.teamEstimate,
                correctedEstimate: unassignedMetrics.correctedEstimate,
                completedHours: unassignedMetrics.completedHours,
                weightedHours: unassignedMetrics.weightedHours,
                progress: 'N/A'
            });

            // Calcular totales sumando los valores de cada perfil
            const totals = profileData.reduce((acc, profile) => ({
                estimatedHours: acc.estimatedHours + profile.estimatedHours,
                teamEstimate: acc.teamEstimate + profile.teamEstimate,
                correctedEstimate: acc.correctedEstimate + profile.correctedEstimate,
                completedHours: acc.completedHours + profile.completedHours,
                weightedHours: acc.weightedHours + profile.weightedHours
            }), {
                estimatedHours: 0,
                teamEstimate: 0,
                correctedEstimate: 0,
                completedHours: 0,
                weightedHours: 0
            });

            const totalProgress = totals.estimatedHours > 0
                ? (totals.weightedHours / totals.estimatedHours) * 100
                : 0;
            
            setTableData({
                profiles: profileData,
                totals,
                totalProgress
            });
            setTimeout(() => {
                setLoading(false);
            }, 1000); // Espera 1000 ms antes de sacar el loading
        };
        
        fetchData();
    }, [tickets]);

    if (loading || !tableData) {
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
                    {tableData.profiles.map((profile) => (
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
                                {loading ? <Skeleton /> : profile.weightedHours.toLocaleString(
                                    'es-ES', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 }
                                )}
                            </td>
                            <td className="p-1">
                                {loading ? <Skeleton /> : profile.progress}
                            </td>
                        </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-black bg-gray-100">
                        <td className="p-1">Total</td>
                        <td className="p-1">{tableData.totals.estimatedHours.toLocaleString()}</td>
                        <td className="p-1">{tableData.totals.teamEstimate.toLocaleString()}</td>
                        <td className="p-1">{tableData.totals.correctedEstimate.toLocaleString()}</td>
                        <td className="p-1">{tableData.totals.completedHours.toLocaleString()}</td>
                        <td className="p-1">{tableData.totals.weightedHours.toLocaleString(
                            'es-ES', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 }
                        )}</td>
                        <td className="p-1">{tableData.totalProgress.toFixed(2).replace('.', ',')}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default SummaryTable;