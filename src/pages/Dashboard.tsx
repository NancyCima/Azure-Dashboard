import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, Clock, User } from 'lucide-react';
import { useTickets as useWorkitems } from '../contexts/TicketsContext';
import { WorkItem } from '../services/api';
import { useExpansion } from '../hooks/useExpansion';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';
import StoryRow from '../components/StoryRow';
import SummaryTable from '../components/SummaryTable';
import PonderacionTable from '../components/PonderacionTable';
import { calcularSemaforos, renderSemaforoEntrega, renderSemaforoConsumo } from '../utils/semaforoUtils';
import { Entregable, entregableStartDates, entregableDueDates } from '../utils/entregableData';
import { Stage, stages } from '../utils/stageData';
import { findTags, normalizeTag } from '../utils/tagUtils';
import { formatDate } from '../utils/dateUtils';
import { calculateEffort, calculateTeamEstimate } from '../utils/effortCalculations';
import { getDaysUntilDelivery, getDaysStatusStyle} from '../utils/deliveryDateUtils';
import {
    calculateUSProgress,
    calculateEntregableProgress,
    calculateStageProgress,
    calculateOverallProgress
} from '../utils/progressCalculations';

function Dashboard() {
    const { workitems, loading, error } = useWorkitems();
    const { expandedItems: expandedStages, toggleItem: toggleStage } = useExpansion<number>();
    const { expandedItems: expandedEntregables, toggleItem: toggleEntregable } = useExpansion<number>();
    const { expandedItems: expandedStories, toggleItem: toggleStory } = useExpansion<number>();
    const [currentView, setCurrentView] = useState<'main' | 'profiles'>('main');

    const getStageForEntregable = (entregable: string): Stage | undefined => {
        const entregableNumber = parseInt(entregable.replace(/\D/g, ''));
        return stages.find(stage => 
            entregableNumber >= stage.entregableRange.start && 
            entregableNumber <= stage.entregableRange.end
        );
    };

    // Filtrar tickets que deberían ser incluidos en el dashboard
    const relevantTickets = workitems.filter(ticket => 
        ticket.state !== "Removed" && (
            ticket.type === 'User Story' ||
            ticket.type === 'Technical Debt' ||
            ticket.type === 'Technical Challenge' || 
            ticket.type === 'Technical Task' ||
            // Incluir tasks sueltas con horas
            (ticket.type === 'Task' && !ticket.parentId && Number(ticket.completed_hours || 0) > 0)
        )
    );

    // Organizar los tickets en user stories y sus work items relacionados
    const userStories: WorkItem[] = relevantTickets.map(story => {
        const etapas = findTags(story.tags, 'etapa');
        const entregables = findTags(story.tags, 'entregable');
        
        // Si tiene entregable pero no etapa, asignar etapa basada en el entregable
        let assignedEtapa = etapas[0];
        if (!assignedEtapa && entregables[0]) {
            const stageForStory = getStageForEntregable(entregables[0]);
            if (stageForStory) {
                assignedEtapa = `etapa${stageForStory.id}`;
            }
        }

        return {
            ...story,
            etapa: assignedEtapa,
            entregable: entregables[0],
            allEtapas: etapas,
            allEntregables: entregables
        };
    });

    // Organizar las user stories por etapa y entregable
    const storiesByStage = stages.map(stage => {
        const storiesInStage = userStories.filter(story => {
            if (story.etapa) {
                const etapaNormalized = normalizeTag(story.etapa);
                return etapaNormalized.number === stage.id;
            }
            return false;
        });

        // Agrupar por entregable
        const entregables: Entregable[] = [];
        const storiesWithoutEntregable: WorkItem[] = [];
        
        storiesInStage.forEach(story => {
            if (!story.entregable) {
                storiesWithoutEntregable.push(story);
                return;
            }

            const entregableNumber = parseInt(story.entregable.replace(/\D/g, ''));
            let entregable = entregables.find(d => d.number === entregableNumber);
            
            if (!entregable) {
                entregable = {
                    number: entregableNumber,
                    stories: [],
                    startDate: entregableStartDates[entregableNumber],
                    dueDate: entregableDueDates[entregableNumber]
                };
                entregables.push(entregable);
            }
            
            entregable.stories.push(story);
        });

        // Ordenar los entregables por número
        entregables.sort((a, b) => a.number - b.number);

        // Si hay historias sin entregable, las agregamos como un entregable especial
        if (storiesWithoutEntregable.length > 0) {
            entregables.push({
                number: -1,
                stories: storiesWithoutEntregable,
                startDate: "No disponible",
                dueDate: "No disponible"
            });
        }

        return {
            ...stage,
            entregables
        };
    });

    const allTickets = userStories.flatMap(story => [
        story,
        ...(story.child_work_items || [])
      ]);
    const totalEffortAllStories = calculateEffort(allTickets);

    // Tickets sin etapa (para mostrar al final)
    const ticketsWithoutEtapa = userStories.filter(story => !story.etapa);
    console.log("ticketsWithoutEtapa", ticketsWithoutEtapa);

    const effortWithoutEtapa = calculateEffort(ticketsWithoutEtapa);

    // Tickets con múltiples etapas (para posible indicador visual)
    const storiesWithMultipleEtapas = userStories.filter(
        story => story.allEtapas && story.allEtapas.length > 1
    );
    console.log("storiesWithMultipleEtapas", storiesWithMultipleEtapas);

    // Tickets sin entregable
    const storiesWithoutEntregableGeneral = userStories.filter(story => !story.entregable);
    console.log("storiesWithoutEntregableGeneral", storiesWithoutEntregableGeneral);

    // Tickets con múltiples entregables
    const storiesWithMultipleEntregables = userStories.filter(
        story => story.allEntregables && story.allEntregables.length > 1
    );
    console.log("storiesWithMultipleEntregables", storiesWithMultipleEntregables);

    const getCompletedStoriesCount = (stories: WorkItem[]) => {
        return stories.filter(story => story.state === 'Closed').length;
    };

    const notAssigned = workitems.filter(story => !story.assignedTo && story.completed_hours);
    console.log(`Cantidad de workitems no asignados: ${notAssigned.length}`);
    console.log("notAssigned", notAssigned);
    
    const allNames = [...new Set(workitems.map(story => story.assignedTo))];
    console.log("Personas asignadas:", allNames);
    return (
        <div className="min-h-screen bg-white">
            <Header 
                showBackButton={currentView === 'main'}
                showProfileButton={currentView === 'main'}
                showDashboardBack={currentView === 'profiles'}
                onProfileClick={() => setCurrentView('profiles')}
                onDashboardBack={() => setCurrentView('main')}
            />
            <div className="p-8">
                <div className="max-w-[1600px] mx-auto">
                    {currentView === 'main' ? (
                        // Contenido Principal del dashboard
                        <div className="w-full">
                            <div className="bg-gray-50 p-6">
                                <h1 className="text-4xl font-bold text-blue-800 mb-6">Dashboard</h1>
                                
                                <div className="w-full mb-6">
                                    <div className="max-w-7xl mx-auto">
                                        {/* Progress bar encima de la tabla */}
                                        <div className="bg-white p-4 rounded-lg shadow mb-4">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                                                <h2 className="text-lg font-semibold text-gray-700">Progreso General del Proyecto</h2>
                                                <span className="font-bold text-lg">{calculateOverallProgress(userStories)}%</span>
                                            </div>
                                            <ProgressBar percentage={calculateOverallProgress(userStories)} />
                                        </div>
                                    </div>
                                    <div>
                                        {/* Tabla de resumen */}
                                        <SummaryTable 
                                            tickets={allTickets.map(ticket => ({
                                                ...ticket,
                                                completed_hours: ticket.completed_hours ?? 0
                                            }))} 
                                            totalEffort={{
                                                completed: totalEffortAllStories.completed,
                                                estimated: totalEffortAllStories.estimated,
                                                corrected: totalEffortAllStories.corrected,
                                                weighted: totalEffortAllStories.weighted,
                                                team: calculateTeamEstimate(allTickets) // <-- Usar allTickets aquí
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Header row con una estructura de columnas consistente */}
                            <div className="bg-gray-100 p-3 mb-4 rounded-lg">
                                <div className="grid grid-cols-[minmax(300px,1fr)_140px_120px_200px_250px_140px] gap-4 items-center">
                                    <div className="text-sm font-semibold text-gray-700">Etapa</div>
                                    <div className="text-sm font-semibold text-gray-700 pl-4">Estado</div>
                                    <div className="text-sm font-semibold text-gray-700 pl-4">Días hábiles restantes</div>
                                    <div className="text-sm font-semibold text-gray-700">Fechas</div>
                                    <div className="text-sm font-semibold text-gray-700">Esfuerzo</div>
                                    <div className="text-sm font-semibold text-gray-700">Progreso</div>
                                </div>
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
        
                            {!loading && !error && userStories.length === 0 && (
                                <div className="text-center bg-blue-50 p-8 rounded-lg">
                                    <p className="text-blue-800 text-xl">No hay user stories disponibles</p>
                                </div>
                            )}
        
                            {!loading && !error && userStories.length > 0 && (
                                <div className="space-y-6">
                                    {storiesByStage.map(stage => {
                                        const stageProgress = calculateStageProgress(stage.entregables);
                                        const completedStories = getCompletedStoriesCount(
                                            stage.entregables.flatMap(e => e.stories)
                                        );
                                        const totalStories = stage.entregables.reduce(
                                            (sum, e) => sum + e.stories.length, 0
                                        );
                                        const effort = calculateEffort(
                                            stage.entregables.flatMap(e => e.stories)
                                        );

                                        // Calcular los datos para los semáforos
                                        const semaforoStage = calcularSemaforos(
                                            stage.entregables.flatMap(e => e.stories)
                                        );
        
                                        return (
                                            <div key={stage.id} className="bg-white rounded-lg shadow">
                                                {/* Cabecera de etapa con grid consistente */}
                                                <div className="bg-blue-100 p-4 cursor-pointer min-h-[80px]" onClick={() => toggleStage(stage.id)}>
                                                    <div className="grid grid-cols-[minmax(300px,1fr)_140px_120px_200px_250px_140px] gap-4 items-center h-full">
                                                        <div className="flex items-center">
                                                            {expandedStages.includes(stage.id) 
                                                                ? <ChevronDown className="w-6 h-6 text-blue-600" />
                                                                : <ChevronRight className="w-6 h-6 text-blue-600" />
                                                            }
                                                            <div>
                                                                <h2 className="text-xl font-semibold text-blue-800">
                                                                    {stage.name} (Entregables {stage.entregableRange.start} - {stage.entregableRange.end})
                                                                </h2>
                                                                <div className="text-sm mt-1">
                                                                    <span className="font-bold text-blue-700 text-lg">{completedStories}</span>
                                                                    <span className="text-gray-600">/{totalStories} User Stories</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-row gap-4 items-center h-full">
                                                            <div className="flex flex-col items-center justify-center h-full">
                                                                <span className="text-xs text-gray-600 mb-1">Avance</span>
                                                                {renderSemaforoEntrega(semaforoStage, stage.dueDate)}
                                                            </div>
                                                            <div className="flex flex-col items-center justify-center h-full">
                                                                <span className="text-xs text-gray-600 mb-1">Consumo</span>
                                                                {renderSemaforoConsumo(semaforoStage)}
                                                            </div>
                                                        </div>

                                                        <div className={`flex items-center justify-center h-full ${getDaysStatusStyle(getDaysUntilDelivery(stage.dueDate), stageProgress)}`}>
                                                            {getDaysUntilDelivery(stage.dueDate)} días
                                                        </div>
                                                        
                                                        <div className="flex flex-col text-sm text-gray-600">
                                                            <div>
                                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                                Inicio: {formatDate(stage.startDate)}
                                                            </div>
                                                            <div>
                                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                                Compromiso: {formatDate(stage.dueDate)}
                                                            </div>
                                                            <div>
                                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                                Entrega: {formatDate(stage.dueDate)}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="text-sm text-gray-600">
                                                            <div className="grid grid-cols-[repeat(2,minmax(40px,1fr))] gap-x-[2px] gap-y-1">
                                                                <span title="Horas estimadas" className="font-medium">Est:</span>
                                                                <span className="text-right">{effort.estimated.toLocaleString('de-DE')}h</span>
                                                                <span title="Horas corregidas" className="font-medium">Corr:</span>
                                                                <span className="text-right">{effort.corrected.toLocaleString('de-DE')}h</span>
                                                                <span title="Horas completadas" className="font-medium">Real:</span>
                                                                <span className="text-right">{effort.completed.toLocaleString('de-DE')}h</span>
                                                                <span title="Horas ponderadas" className="font-medium">Pond:</span>
                                                                <span className="text-right">{effort.weighted.toLocaleString('de-DE')}h</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-[140px]">
                                                            <ProgressBar 
                                                                percentage={stageProgress} 
                                                                showPercentage={true}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {expandedStages.includes(stage.id) && (
                                                    <div className="p-4">
                                                        {stage.entregables.map(entregable => {
                                                            // Calcular los datos para los semáforos del entregable
                                                            const semaforoDataEntregables = calcularSemaforos(
                                                                entregable.stories
                                                            );

                                                            const entregableProgress= calculateEntregableProgress(entregable.stories)

                                                            return (
                                                                <div key={entregable.number} className="mb-4">
                                                                    {/* Entregable con grid consistente */}
                                                                    <div 
                                                                        className="bg-blue-50 p-3 cursor-pointer rounded-lg"
                                                                        onClick={() => toggleEntregable(entregable.number)}
                                                                    >
                                                                        <div className="grid grid-cols-[300px_150px_120px_200px_250px_200px] gap-4 items-center">
                                                                            <div className="flex items-center ml-4">
                                                                                {expandedEntregables.includes(entregable.number)
                                                                                    ? <ChevronDown className="w-5 h-5 mr-2 text-blue-600" />
                                                                                    : <ChevronRight className="w-5 h-5 mr-2 text-blue-600" />
                                                                                }
                                                                                <h3 className="text-lg font-medium text-blue-700">
                                                                                    {entregable.number === -1 
                                                                                        ? "User Stories sin Entregable" 
                                                                                        : `Entregable ${entregable.number}`}
                                                                                </h3>
                                                                            </div>
                                                                            <div className="flex flex-row gap-4 items-center ">
                                                                                <div className="flex flex-col items-center">
                                                                                    <span className="text-xs text-gray-600 mb-1">Avance</span>
                                                                                    {renderSemaforoEntrega(semaforoDataEntregables, entregable.dueDate)}
                                                                                </div>
                                                                                <div className="flex flex-col items-center">
                                                                                    <span className="text-xs text-gray-600 mb-1">Consumo</span>
                                                                                    {renderSemaforoConsumo(semaforoDataEntregables)}
                                                                                </div>
                                                                            </div>
                                                                            <div className={`text-sm ${getDaysStatusStyle(getDaysUntilDelivery(entregable.dueDate), entregableProgress)}`}>
                                                                                {getDaysUntilDelivery(entregable.dueDate)} días
                                                                            </div>
                                                                            <div className="flex flex-col text-sm text-gray-600">
                                                                                <div>
                                                                                    <Calendar className="w-4 h-4 inline mr-1" />
                                                                                    Inicio: {formatDate(entregable.startDate)}
                                                                                </div>
                                                                                <div>
                                                                                    <Calendar className="w-4 h-4 inline mr-1" />
                                                                                    Compromiso: {formatDate(entregable.dueDate)}
                                                                                </div>
                                                                                <div>
                                                                                    <Calendar className="w-4 h-4 inline mr-1" />
                                                                                    Entrega: {formatDate(entregable.dueDate)}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-sm text-gray-600">
                                                                                <div className="grid grid-cols-[auto_auto] gap-x-2">
                                                                                    <span title="Horas estimadas" className="font-medium">Est:</span>
                                                                                    <span className="text-right">{(calculateEffort(entregable.stories)).estimated.toLocaleString('de-DE')}h</span>
                                                                                    <span title="Horas ponderadas" className="font-medium">Pond:</span>
                                                                                    <span className="text-right">{(calculateEffort(entregable.stories)).weighted.toLocaleString('de-DE')}h</span>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <ProgressBar 
                                                                                    percentage={entregableProgress} 
                                                                                    showPercentage={true}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
            
                                                                    {expandedEntregables.includes(entregable.number) && (
                                                                        <div className="mt-4 overflow-x-auto">
                                                                            {/* Tabla de user stories con estructura alineada */}
                                                                            <table className="w-full table-auto">
                                                                                <thead>
                                                                                    <tr className="bg-gray-50">
                                                                                        <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[8%]">ID</th>
                                                                                        <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[25%]">Título</th>
                                                                                        <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[10%]">Estado</th>
                                                                                        <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[15%]">Asignado a</th>
                                                                                        <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[15%]">Fecha de Entrega</th>
                                                                                        <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[12%]">Esfuerzo</th>
                                                                                        <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[15%]">Progreso</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-200">
                                                                                    {entregable.stories.map(story => (
                                                                                        <StoryRow
                                                                                        key={story.id}
                                                                                        story={story}
                                                                                        expanded={expandedStories.includes(story.id)}
                                                                                        onToggle={() => toggleStory(story.id)}
                                                                                        progress={calculateUSProgress(story.child_work_items ?? [])}
                                                                                        />
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                        );
                                                    })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/* Mostrar User Stories sin Etapa */}
                                    {ticketsWithoutEtapa.length > 0 && (
                                            <div className="bg-white rounded-lg shadow">
                                            {/* Cabecera con estilo de etapa */}
                                            <div 
                                                className="bg-blue-100 p-4 cursor-pointer"
                                                onClick={() => toggleStage(-2)} // Usamos -2 para "Sin etapa"
                                            >
                                                <div className="grid grid-cols-[300px_150px_120px_200px_250px_200px] gap-4 items-center">
                                                    <div className="flex items-center">
                                                        {expandedStages.includes(-2) 
                                                            ? <ChevronDown className="w-6 h-6 text-blue-600" />
                                                            : <ChevronRight className="w-6 h-6 text-blue-600" />
                                                        }
                                                        <div>
                                                            <h2 className="text-xl font-semibold text-blue-800">
                                                                Sin etapa
                                                            </h2>
                                                            <div className="text-sm mt-1">
                                                                <span className="font-bold text-blue-700 text-lg">{getCompletedStoriesCount(ticketsWithoutEtapa)}</span>
                                                                <span className="text-gray-600">/{ticketsWithoutEtapa.length} User Stories</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {/* Estado si existe */}
                                                    </div>
                                                    <div>
                                                        {/* Info día restantes si existe */}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 inline mr-1" />
                                                        Sin fecha de entrega
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <div className="grid grid-cols-[auto_auto] gap-x-2">
                                                            <span title="Horas estimadas" className="font-medium">Est:</span>
                                                            <span className="text-right">{effortWithoutEtapa.estimated.toLocaleString('de-DE')}h</span>
                                                            <span title="Horas corregidas" className="font-medium">Corr:</span>
                                                            <span className="text-right">{effortWithoutEtapa.corrected.toLocaleString('de-DE')}h</span>
                                                            <span title="Horas completadas" className="font-medium">Real:</span>
                                                            <span className="text-right">{effortWithoutEtapa.completed.toLocaleString('de-DE')}h</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <ProgressBar 
                                                            percentage={calculateEntregableProgress(ticketsWithoutEtapa)} 
                                                            showPercentage={true}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedStages.includes(-2) && (
                                                <div className="p-4">
                                                    {/* Tabla de user stories con estructura alineada */}
                                                    <table className="w-full table-auto">
                                                        <thead>
                                                            <tr className="bg-gray-50">
                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[8%]">ID</th>
                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[25%]">Título</th>
                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[10%]">Estado</th>
                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[15%]">Asignado a</th>
                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[15%]">Fecha de Entrega</th>
                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[12%]">Esfuerzo</th>
                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[15%]">Progreso</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {ticketsWithoutEtapa.map(story => (
                                                                <StoryRow
                                                                    key={story.id}
                                                                    story={story}
                                                                    expanded={expandedStories.includes(story.id)}
                                                                    onToggle={() => toggleStory(story.id)}
                                                                    progress={calculateUSProgress(story.child_work_items ?? [])}
                                                                />
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Sección de perfiles
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-3xl font-bold text-blue-800 mb-6">Perfiles de Recursos</h2>
                            </div>
                            {/* Tabla de ponderaciones*/}
                            <PonderacionTable tickets={workitems} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;