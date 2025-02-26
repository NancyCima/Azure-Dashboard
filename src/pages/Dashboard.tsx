import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Calendar, Clock, User, Flame } from 'lucide-react';
import { useTickets } from '../contexts/TicketsContext';
import Header from '../components/Header';
import { UserStory, WorkItem } from '../services/api';

interface UserStoryWithWorkItems {
    id: number;
    title: string;
    state: string;
    work_item_url: string;
    dueDate: string;
    tags: string[];
    storyPoints: number;
    workItems: WorkItem[];
    assignedTo: string;
    entregable?: string;
}

interface Stage {
    id: number;
    name: string;
    entregableRange: {
        start: number;
        end: number;
    };
    dueDate: string;
    startDate: string;
    riskLevel: 'low' | 'medium' | 'high';
}

interface Entregable {
    number: number;
    stories: UserStoryWithWorkItems[];
    dueDate: string;
}

const stages: Stage[] = [
    { 
        id: 1, 
        name: 'Etapa 1', 
        entregableRange: { start: 0, end: 13 }, 
        dueDate: '2025-05-23',
        startDate: '2025-02-01',
        riskLevel: 'low'
    },
    { 
        id: 2, 
        name: 'Etapa 2', 
        entregableRange: { start: 14, end: 34 }, 
        dueDate: '2025-09-26',
        startDate: '-',
        riskLevel: 'medium'
    },
    { 
        id: 3, 
        name: 'Etapa 3', 
        entregableRange: { start: 35, end: 55 }, 
        dueDate: '2025-12-19',
        startDate: '-',
        riskLevel: 'medium'
    },
    { 
        id: 4, 
        name: 'Etapa 4', 
        entregableRange: { start: 56, end: 70 }, 
        dueDate: '2026-02-27',
        startDate: '-',
        riskLevel: 'high'
    }
];

const ProgressBar = ({ percentage, showPercentage = true }: { percentage: number, showPercentage?: boolean }) => (
    <div className="w-full">
        {showPercentage && (
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-blue-800">{percentage}%</span>
            </div>
        )}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
                className={`h-2.5 rounded-full transition-all duration-300 ${
                    percentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
        </div>
    </div>
);

function Dashboard() {
    const { tickets, loading, error } = useTickets();
    const [expandedStories, setExpandedStories] = useState<number[]>([]);
    const [expandedStages, setExpandedStages] = useState<number[]>([]);
    const [expandedEntregables, setExpandedEntregables] = useState<number[]>([]);

    const toggleStory = (storyId: number) => {
        setExpandedStories(prev => 
            prev.includes(storyId)
                ? prev.filter(id => id !== storyId)
                : [...prev, storyId]
        );
    };

    const toggleStage = (stageId: number) => {
        setExpandedStages(prev =>
            prev.includes(stageId)
                ? prev.filter(id => id !== stageId)
                : [...prev, stageId]
        );
    };

    const toggleEntregable = (entregableNumber: number) => {
        setExpandedEntregables(prev =>
            prev.includes(entregableNumber)
                ? prev.filter(id => id !== entregableNumber)
                : [...prev, entregableNumber]
        );
    };

    const getDaysUntilDelivery = (dueDate: string) => {
        const today = new Date();
        const deliveryDate = new Date(dueDate);
        const diffTime = deliveryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const getStageStatus = (stage: Stage, stories: UserStoryWithWorkItems[]) => {
        // Si no hay historias, el riesgo es bajo
        if (stories.length === 0) {
            return (
                <span className="px-3 py-1 rounded-full text-sm bg-blue-300 text-white">
                    Bajo riesgo
                </span>
            );
        }
        
        // Calcular los días restantes hasta la fecha de entrega
        const today = new Date();
        const deliveryDate = new Date(stage.dueDate);
        const diffTime = deliveryDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Determinar el nivel de riesgo basado en los días restantes
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        
        if (daysRemaining <= 15) {
            riskLevel = 'high';
        } else if (daysRemaining <= 30) {
            riskLevel = 'medium';
        } else {
            riskLevel = 'low';
        }
        
        // Determinar el texto de estado basado en el nivel de riesgo
        let statusText = 'Según lo previsto';
        
        // Mapear los niveles de riesgo a clases de color
        const riskColorClasses = {
            low: 'bg-green-500 text-white',  // Verde para "Según lo previsto"
            medium: 'bg-blue-500 text-white', // Azul para riesgo medio
            high: 'bg-purple-500 text-white'  // Púrpura para riesgo alto
        };
        
        return (
            <span className={`px-3 py-1 rounded-full text-sm ${riskColorClasses[riskLevel]}`}>
                {riskLevel === 'low' ? statusText : `Riesgo ${riskLevel === 'medium' ? 'medio' : 'alto'}`}
            </span>
        );
    };

    const calculateStageEffort = (stories: UserStoryWithWorkItems[]) => {
        const estimatedHours = stories.reduce((sum, story) => {
            return sum + story.workItems.reduce((acc, item) => acc + Number(item.estimated_hours || 0), 0);
        }, 0);
        
        const completedHours = stories.reduce((sum, story) => {
            return sum + story.workItems.reduce((acc, item) => acc + Number(item.completed_hours || 0), 0);
        }, 0);

        return {
            estimated: Math.round(estimatedHours),
            completed: Math.round(completedHours)
        };
    };

    const calculateProgress = (workItems: WorkItem[], storyState: string) => {
        if (!workItems || workItems.length === 0) return 0;

        // Si todos los work items están en estado "Closed", la User Story está al 100%
        if (storyState === "Closed" && workItems.every(item => item.state === "Closed")) {
            return 100;
        }

        const totalEstimated = workItems.reduce((sum, item) => sum + Number(item.estimated_hours), 0);
        const totalCompleted = workItems.reduce((sum, item) => sum + Number(item.completed_hours), 0);

        if (totalEstimated === 0) return 0; // Evitar división por cero

        const actualProgress = Math.round((totalCompleted / totalEstimated) * 100);
        return storyState !== "Closed" ? Math.min(actualProgress, 95) : actualProgress;
    };

    const calculateWorkItemProgress = (item: WorkItem) => {
        if (!item) return 0;

        if (item.state === "Closed") return 100; // Si el ticket está cerrado, está completado al 100%

        const estimatedHours = Number(item.estimated_hours) || 0;
        const completedHours = Number(item.completed_hours) || 0;

        if (estimatedHours === 0) return 0; // Si no hay horas estimadas, no se puede calcular progreso

        const progress = Math.round((completedHours / estimatedHours) * 100);
        return Math.min(progress, 95);
    };

    const calculateEntregableProgress = (stories: UserStoryWithWorkItems[]) => {
        if (!stories || stories.length === 0) return 0;
        
        const totalProgress = stories.reduce((sum, story) => {
            return sum + calculateProgress(story.workItems, story.state);
        }, 0);
        
        return Math.round(totalProgress / stories.length);
    };

    const calculateStageProgress = (entregables: Entregable[]) => {
        if (!entregables || entregables.length === 0) return 0;
        
        const totalProgress = entregables.reduce((sum, entregable) => {
            return sum + calculateEntregableProgress(entregable.stories);
        }, 0);
        
        return Math.round(totalProgress / entregables.length);
    };

    const calculateOverallProgress = () => {
        const totalStories = userStories.length;
        if (totalStories === 0) return 0;
        
        const totalProgress = userStories.reduce((sum, story) => {
            return sum + calculateProgress(story.workItems, story.state);
        }, 0);
        
        return Math.round(totalProgress / totalStories);
    };

    const formatDate = (dateString: string) => {
        if (!dateString || dateString === '-' || dateString === 'No disponible') return 'No definida';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Fecha inválida';
        }
    };

    const EffortComparison = ({ story }: { story: UserStoryWithWorkItems }) => {
        if (!story.workItems || story.workItems.length === 0 || story.storyPoints === 0) {
            return (
                <span className="text-sm text-gray-500">
                    No disponible
                </span>
            );
        }

        // Cálculo del estimado total
        const totalEstimatedFromWorkItems = story.workItems.reduce(
            (sum, item) => sum + Number(item.estimated_hours || 0), 0
        );
    
        // Si no hay estimaciones en los Work Items, usar Story Points
        const estimatedHours = totalEstimatedFromWorkItems > 0 
            ? totalEstimatedFromWorkItems 
            : story.storyPoints * 4; // Fallback 1 SP = 4 horas
        
        const actualHours = story.workItems.reduce(
            (sum, item) => sum + Number(item.completed_hours || 0), 0
        );
    
        const difference = actualHours - estimatedHours;
    
        return (
            <div className="grid grid-cols-[auto_auto_auto] gap-2 items-center w-full">
                <div className="flex items-center whitespace-nowrap">
                    <Clock className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-600">
                        Est: {estimatedHours}h
                    </span>
                </div>
                <div className="flex items-center whitespace-nowrap">
                    <Clock className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-600">
                        Real: {actualHours}h
                    </span>
                </div>
                {difference !== 0 && (
                    <span className={`text-sm flex items-center whitespace-nowrap ${difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {difference > 0 ? '+' : ''}{difference}h
                    </span>
                )}
            </div>
        );
    };

    const getStageForEntregable = (entregable: string): Stage | undefined => {
        const entregableNumber = parseInt(entregable.replace(/\D/g, ''));
        return stages.find(stage => 
            entregableNumber >= stage.entregableRange.start && 
            entregableNumber <= stage.entregableRange.end
        );
    };

      // Organizar los tickets en user stories y sus work items relacionados
    const userStories: UserStoryWithWorkItems[] = tickets
        .filter(ticket => ticket.work_item_type === 'User Story')
        .map(story => {
            // Asegurar que story es tratado como una UserStory
            const userStory = story as unknown as UserStory;

            // Extraer IDs desde los `child_links`
            const childIds = userStory.child_links?.map(link => {
                const match = link.match(/workItems\/(\d+)$/);
                return match ? parseInt(match[1], 10) : null;
            }).filter(id => id !== null) as number[];

            const workItems: WorkItem[] = tickets
                .filter(ticket => childIds.includes(ticket.id)) // Filtrar solo los hijos
                .map(ticket => ({
                    id: ticket.id,
                    title: ticket.title || "Sin título",
                    state: ticket.state || "Desconocido",
                    estimated_hours: Number(ticket.estimated_hours) || 0,
                    completed_hours: Number(ticket.completed_hours) || 0,
                    work_item_url: ticket.work_item_url || "#",
                    work_item_type: ticket.work_item_type
                }));

            // Extraer el entregable de los tags
            const entregable = story.tags?.split(';')
                .find(tag => tag.trim().toLowerCase().startsWith('entregable'))?.trim();

            return {
                id: story.id,
                title: story.title,
                state: story.state,
                work_item_url: story.work_item_url,
                dueDate: story.due_date || 'No disponible',
                tags: story.tags ? story.tags.split(';').filter(tag => tag.trim()) : [],
                storyPoints: typeof story.story_points === 'number'? story.story_points : story.story_points && !isNaN(Number(story.story_points)) ? Number(story.story_points): 0,
                assignedTo: typeof story.assigned_to === 'string' ? story.assigned_to : story.assigned_to?.displayName || 'No asignado',
                workItems,
                entregable,
            };
        });

    // Organizar las user stories por etapa y entregable
    const storiesByStage = stages.map(stage => {
        const storiesInStage = userStories.filter(story => {
            if (!story.entregable) return false;
            const stageForStory = getStageForEntregable(story.entregable);
            return stageForStory?.id === stage.id;
        });

        // Agrupar por entregable
        const entregables: Entregable[] = [];
        storiesInStage.forEach(story => {
            if (!story.entregable) return;
            
            const entregableNumber = parseInt(story.entregable.replace(/\D/g, ''));
            let entregable = entregables.find(d => d.number === entregableNumber);
            
            if (!entregable) {
                entregable = {
                    number: entregableNumber,
                    stories: [],
                    dueDate: stage.dueDate
                };
                entregables.push(entregable);
            }
            
            entregable.stories.push(story);
        });

        // Ordenar los entregables por número
        entregables.sort((a, b) => a.number - b.number);

        return {
            ...stage,
            entregables
        };
    });

    const getCompletedStoriesCount = (stories: UserStoryWithWorkItems[]) => {
        return stories.filter(story => story.state === 'Closed').length;
    };

    const StoryRow = ({ story }: { story: UserStoryWithWorkItems }) => (
        <React.Fragment>
            <tr 
                className="hover:bg-blue-50 cursor-pointer"
                onClick={() => toggleStory(story.id)}
            >
                <td className="px-2 py-4 whitespace-nowrap w-[8%]">
                    <div className="flex items-center">
                        {expandedStories.includes(story.id) 
                            ? <ChevronDown className="w-4 h-4 mr-1 text-blue-600" />
                            : <ChevronRight className="w-4 h-4 mr-1 text-blue-600" />
                        }
                        <span className="font-medium text-blue-800">#{story.id}</span>
                        <a
                            href={story.work_item_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(story.work_item_url, '_blank');
                            }}
                        >
                            <ExternalLink className="w-4 h-4 text-blue-600 hover:text-blue-800" />
                        </a>
                    </div>
                </td>
                <td className="px-2 py-4 w-[25%]">
                    <span className="text-gray-900 line-clamp-2">{story.title}</span>
                </td>
                <td className="px-2 py-4 w-[15%]">
                    <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        <span className="truncate max-w-[120px]">{story.assignedTo}</span>
                    </div>
                </td>
                <td className="px-2 py-4 w-[10%]">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {story.state}
                    </span>
                </td>
                <td className="px-2 py-4 w-[15%]">
                    <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(story.dueDate)}
                    </div>
                </td>
                <td className="px-2 py-4 w-[12%]">
                    <EffortComparison story={story} />
                </td>
                <td className="px-2 py-4 w-[15%]">
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-800">
                                {calculateProgress(story.workItems, story.state)}%
                            </span>
                        </div>
                        <ProgressBar percentage={calculateProgress(story.workItems, story.state)} />
                    </div>
                </td>
            </tr>
            {expandedStories.includes(story.id) && story.workItems.length > 0 && (
                story.workItems.map(item => {
                    const isQaTask = item.work_item_type === 'QA Task';
                    const progress = calculateWorkItemProgress(item);
                    
                    return (
                        <tr key={item.id} className="bg-gray-50 border-l-4 border-blue-100">
                            <td className="px-2 py-3 pl-12">
                                <div className="flex items-center">
                                    {isQaTask && <Flame className="w-4 h-4 mr-1 text-yellow-500" />}
                                    <span className="font-medium text-gray-600">#{item.id}</span>
                                    <a
                                        href={item.work_item_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2"
                                    >
                                        <ExternalLink className="w-4 h-4 text-blue-600 hover:text-blue-800" />
                                    </a>
                                </div>
                            </td>
                            <td className="px-2 py-3">
                                <span className="text-gray-600 line-clamp-1">
                                    {item.title}
                                </span>
                            </td>
                            <td className="px-2 py-3">
                                <span className="text-gray-500">-</span>
                            </td>
                            <td className="px-2 py-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {item.state}
                                </span>
                            </td>
                            <td className="px-2 py-3">
                                <span className="text-gray-500">-</span>
                            </td>
                            <td className="px-2 py-3">
                                <div className="grid grid-cols-[auto_auto] gap-2 items-center">
                                    <div className="flex items-center whitespace-nowrap">
                                        <Clock className="w-4 h-4 mr-1 text-gray-500" />
                                        <span className="text-sm text-gray-600">
                                            Est: {item.estimated_hours}h
                                        </span>
                                    </div>
                                    <div className="flex items-center whitespace-nowrap">
                                        <Clock className="w-4 h-4 mr-1 text-gray-500" />
                                        <span className="text-sm text-gray-600">
                                            Real: {item.completed_hours}h
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-2 py-3">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-blue-800">
                                            {progress}%
                                        </span>
                                    </div>
                                    <ProgressBar percentage={progress} />
                                </div>
                            </td>
                        </tr>
                    );
                })
            )}
        </React.Fragment>
    );

    return (
        <div className="min-h-screen bg-white">
            <Header showBackButton />
            <div className="p-8">
                <div className="max-w-[1600px] mx-auto">
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-4xl font-bold text-blue-800">Dashboard</h1>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <h2 className="text-lg font-semibold text-gray-700 mb-2">Progreso General del Proyecto</h2>
                                <ProgressBar percentage={calculateOverallProgress()} />
                            </div>
                        </div>

                        {/* Add header row */}
                        <div className="bg-gray-100 p-3 mb-4 rounded-lg">
                            <div className="grid grid-cols-[300px_1fr] gap-6">
                                <div className="text-sm font-semibold text-gray-700">
                                    Etapa
                                </div>
                                <div className="grid grid-cols-6 gap-6">
                                    <div className="text-sm font-semibold text-gray-700">Fecha Inicio</div>
                                    <div className="text-sm font-semibold text-gray-700">Fecha Entrega</div>
                                    <div className="text-sm font-semibold text-gray-700">Días restantes</div>
                                    <div className="text-sm font-semibold text-gray-700">Progreso</div>
                                    <div className="text-sm font-semibold text-gray-700">Estado</div>
                                    <div className="text-sm font-semibold text-gray-700">Esfuerzo</div>
                                </div>
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
                                    const effort = calculateStageEffort(
                                        stage.entregables.flatMap(e => e.stories)
                                    );
                                    const daysUntilDelivery = getDaysUntilDelivery(stage.dueDate);

                                    return (
                                        <div key={stage.id} className="bg-white rounded-lg shadow">
                                            <div 
                                                className="bg-blue-100 p-4 cursor-pointer"
                                                onClick={() => toggleStage(stage.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
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
                                                    
                                                    <div className="grid grid-cols-6 gap-6 items-center">
                                                        <div className="text-sm text-gray-600">
                                                            <Calendar className="w-4 h-4 inline mr-1" />
                                                            {formatDate(stage.startDate)}
                                                        </div>
                                                        
                                                        <div className="text-sm text-gray-600">
                                                            <Calendar className="w-4 h-4 inline mr-1" />
                                                            {formatDate(stage.dueDate)}
                                                        </div>
                                                        
                                                        <div className="text-sm text-gray-600">
                                                            {daysUntilDelivery} días
                                                        </div>
                                                        
                                                        <div className="w-32">
                                                            <ProgressBar 
                                                                percentage={stageProgress} 
                                                                showPercentage={true}
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            {getStageStatus(stage, stage.entregables.flatMap(e => e.stories))}
                                                        </div>
                                                        
                                                        <div className="text-sm text-gray-600">
                                                            <span title="Horas estimadas">Est: {effort.estimated}h</span>
                                                            <br />
                                                            <span title="Horas completadas">Real: {effort.completed}h</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {expandedStages.includes(stage.id) && (
                                                <div className="p-4">
                                                    {stage.entregables.map(entregable => (
                                                        <div key={entregable.number} className="mb-4">
                                                            <div 
                                                                className="bg-blue-50 p-3 cursor-pointer rounded-lg"
                                                                onClick={() => toggleEntregable(entregable.number)}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        {expandedEntregables.includes(entregable.number)
                                                                            ? <ChevronDown className="w-5 h-5 mr-2 text-blue-600" />
                                                                            : <ChevronRight className="w-5 h-5 mr-2 text-blue-600" />
                                                                        }
                                                                        <h3 className="text-lg font-medium text-blue-700">
                                                                            Entregable {entregable.number}
                                                                        </h3>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-sm text-gray-600">
                                                                            <Calendar className="w-4 h-4 inline mr-1" />
                                                                            {formatDate(entregable.dueDate)}
                                                                        </div>
                                                                        <div className="w-32">
                                                                            <ProgressBar 
                                                                                percentage={calculateEntregableProgress(entregable.stories)} 
                                                                                showPercentage={true}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {expandedEntregables.includes(entregable.number) && (
                                                                <div className="mt-4 overflow-x-auto">
                                                                    <table className="w-full table-auto">
                                                                        <thead>
                                                                            <tr className="bg-gray-50">
                                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[8%]">ID</th>
                                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[25%]">Título</th>
                                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[15% ]">Asignado a</th>
                                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[10%]">Estado</th>
                                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[15%]">Fecha de Entrega</th>
                                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[12%]">Esfuerzo</th>
                                                                                <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[15%]">Progreso</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-200">
                                                                            {entregable.stories.map(story => (
                                                                                <StoryRow key={story.id} story={story} />
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;