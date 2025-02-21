import React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Calendar, Tag, Clock, User, Flame } from 'lucide-react';
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
}

const stages: Stage[] = [
    { id: 1, name: 'Etapa 1', entregableRange: { start: 0, end: 13 } },
    { id: 2, name: 'Etapa 2', entregableRange: { start: 14, end: 34 } },
    { id: 3, name: 'Etapa 3', entregableRange: { start: 35, end: 55 } },
    { id: 4, name: 'Etapa 4', entregableRange: { start: 56, end: 70 } },
];

const ProgressBar = ({ percentage }: { percentage: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
            className={`h-2.5 rounded-full transition-all duration-300 ${
                percentage === 100 ? 'bg-green-600' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
    </div>
);

function Dashboard() {
    const { tickets, loading, error } = useTickets();
    const [expandedStories, setExpandedStories] = useState<number[]>([]);
    const [expandedStages, setExpandedStages] = useState<number[]>([]);

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

    const calculateProgress = (workItems: WorkItem[]) => {
        if (!workItems || workItems.length === 0) return 0;
    
        // ✅ Si todos los work items están en estado "Closed", la User Story está al 100%
        const allClosed = workItems.every(item => item.state === "Closed");
        if (allClosed) return 100;
    
        const totalEstimated = workItems.reduce((sum, item) => sum + Number(item.estimated_hours), 0);
        const totalCompleted = workItems.reduce((sum, item) => sum + Number(item.completed_hours), 0);
    
        if (totalEstimated === 0) return 0; // Evitar división por cero
    
        return Math.round((totalCompleted / totalEstimated) * 100);
    };

    const calculateWorkItemProgress = (item: WorkItem) => {
        if (!item) return 0;
    
        if (item.state === "Closed") return 100; // ✅ Si el ticket está cerrado, está completado al 100%
    
        const estimatedHours = Number(item.estimated_hours) || 0;
        const completedHours = Number(item.completed_hours) || 0;
    
        if (estimatedHours === 0) return 0; // Si no hay horas estimadas, no se puede calcular progreso
    
        return Math.round((completedHours / estimatedHours) * 100);
    };

    const formatDate = (dateString: string) => {
        if (!dateString || dateString === 'No disponible') return 'No definida';
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
        const isOverEstimated = difference > 0;
        const isUnderEstimated = difference < 0;
    
        return (
            <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-600">
                        Est: {estimatedHours}h
                    </span>
                </div>
                <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-600">
                        Real: {actualHours}h
                    </span>
                </div>
                {difference !== 0 && (
                    <span className={`text-sm flex items-center ${isOverEstimated ? 'text-red-600' : 'text-green-600'}`}>
                        {isOverEstimated ? '+' : ''}{difference}h
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

    // Organizar las user stories por etapa
    const storiesByStage = stages.map(stage => {
        const storiesInStage = userStories.filter(story => {
            if (!story.entregable) return false;
            const stageForStory = getStageForEntregable(story.entregable);
            return stageForStory?.id === stage.id;
        });
        return {
            ...stage,
            stories: storiesInStage,
        };
    });

    const StoryRow = ({ story }: { story: UserStoryWithWorkItems }) => (
        <React.Fragment>
            <tr 
                className="hover:bg-blue-50 cursor-pointer"
                onClick={() => toggleStory(story.id)}
            >
                <td className="px-2 py-4 whitespace-nowrap w-[7%]">
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
                <td className="px-2 py-4 w-[20%]">
                    <span className="text-gray-900 line-clamp-2">{story.title}</span>
                </td>
                <td className="px-2 py-4 w-[10%]">
                    <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        <span className="truncate">{story.assignedTo}</span>
                    </div>
                </td>
                <td className="px-2 py-4 w-[8%]">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {story.state}
                    </span>
                </td>
                <td className="px-2 py-4 w-[12%]">
                    <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(story.dueDate)}
                    </div>
                </td>
                <td className="px-2 py-4 w-[13%]">
                    <div className="flex flex-wrap gap-1">
                        {story.tags.map((tag, index) => (
                            <span 
                                key={index}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 truncate max-w-[120px]"
                            >
                                <Tag className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{tag}</span>
                            </span>
                        ))}
                    </div>
                </td>
                <td className="px-2 py-4 w-[13%]">
                    <EffortComparison story={story} />
                </td>
                <td className="px-2 py-4 w-[17%]">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-800">
                                {calculateProgress(story.workItems)}%
                            </span>
                        </div>
                        <ProgressBar percentage={calculateProgress(story.workItems)} />
                    </div>
                </td>
            </tr>
            {expandedStories.includes(story.id) && story.workItems.length > 0 && (
                story.workItems.map(item => {
                    const isQaTask = item.work_item_type === 'QA Task';
                    const progress = calculateWorkItemProgress(item);
                    
                    return (
                        <tr key={item.id} className="bg-gray-50 border-l-4 border-blue-100">
                            <td className="px-6 py-3 pl-16">
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
                            <td className="px-6 py-3">
                                <span className={`text-gray-600`}>
                                    {item.title}
                                </span>
                            </td>
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {item.state}
                                </span>
                            </td>
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1 text-gray-500" />
                                        <span className="text-sm text-gray-600">
                                            Est: {item.estimated_hours}h
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1 text-gray-500" />
                                        <span className="text-sm text-gray-600">
                                            Real: {item.completed_hours}h
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-3">
                                <div className="w-64">
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
            <div className='p-4 lg:p-8'>
                <div className="max-w-[1600px] mx-auto">
                    <div className="w-full">
                        <h1 className="text-4xl font-bold text-blue-800 mb-8">Dashboard</h1>
                        
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
                                {storiesByStage.map(stage => (
                                    <div key={stage.id} className="bg-white rounded-lg shadow">
                                        <div 
                                            className="bg-blue-100 p-4 cursor-pointer flex items-center"
                                            onClick={() => toggleStage(stage.id)}
                                        >
                                            {expandedStages.includes(stage.id) 
                                                ? <ChevronDown className="w-6 h-6 mr-2 text-blue-600" />
                                                : <ChevronRight className="w-6 h-6 mr-2 text-blue-600" />
                                            }
                                            <h2 className="text-xl font-semibold text-blue-800">
                                                {stage.name} (Entregables {stage.entregableRange.start} - {stage.entregableRange.end})
                                            </h2>
                                            <span className="ml-4 text-blue-600">
                                                {stage.stories.length} User Stories
                                            </span>
                                        </div>
                                        
                                        {expandedStages.includes(stage.id) && (
                                            <div>
                                                <table className="w-full table-auto">
                                                    <thead>
                                                        <tr className="bg-blue-50">
                                                            <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[7%]">ID</th>
                                                            <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[20%]">Título</th>
                                                            <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[10%]">Asignado a</th>
                                                            <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[8%]">Estado</th>
                                                            <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[12%]">Fecha de Entrega</th>
                                                            <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[13%]">Tags</th>
                                                            <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[13%]">Esfuerzo</th>
                                                            <th className="px-2 py-3 text-left text-sm font-semibold text-blue-800 w-[17%]">Progreso</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {stage.stories.map(story => (
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
                </div>              
            </div>
        </div>
    );
}

export default Dashboard;