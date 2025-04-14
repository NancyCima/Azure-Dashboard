import { WorkItem } from '../services/api';
import { Entregable } from '../utils/entregableData';

// Cálculo de progreso para work item
export const calculateWorkItemProgress = (item: WorkItem) => {
    if (!item ) return 0;
    
    const estimatedHours = Number(item.estimated_hours) || 0;
    const completedHours = Number(item.completed_hours) || 0;
    
    if (estimatedHours <= 0) return 0; // Si no hay horas estimadas, no se puede calcular progreso
    
    const progress = Math.round((completedHours / estimatedHours) * 100);
    return progress;
};

// Cálculo de progreso para user story
export const calculateUSProgress = (workItems?: WorkItem[]): number => {
    // Validación inicial
    if (!workItems || workItems.length === 0) return 0;

    // Calcular total de horas estimadas de todos los work items
    const totalEstimated = workItems.reduce(
        (sum, item) => sum + (Number(item.estimated_hours) || 0), 
        0
    );
    
    // Si no hay horas estimadas, progreso 0%
    if (totalEstimated === 0) return 0;

    // Calcular valor completado: suma de horas estimadas de work items CERRADOS
    const completedValue = workItems
        .filter(item => item.state === "Closed")
        .reduce((sum, item) => sum + (Number(item.estimated_hours) || 0), 0);
        
    // Calcular porcentaje (completado / total)
    return Math.round((completedValue / totalEstimated) * 100);
};

// Cálculo de progreso para un entregable
export const calculateEntregableProgress = (stories: WorkItem[]): number  => {
    if (!stories || stories.length === 0) return 0;
    
    const totalEstimated = stories.reduce((sum, story) => {
        return sum + (story.child_work_items?.reduce((acc, item) => 
            acc + (Number(item.estimated_hours) || 0), 0) ?? 0);
    }, 0);

    if (totalEstimated === 0) return 0;

    const completedValue = stories.reduce((sum, story) => {
        const storyEstimated = story.child_work_items?.reduce((acc, item) => 
            acc + (Number(item.estimated_hours) || 0), 0) ?? 0;

        const storyProgress = calculateUSProgress(story.child_work_items ?? []) || 0;
        return sum + (storyProgress / 100) * storyEstimated;
    }, 0);

    return Math.round((completedValue / totalEstimated) * 100);
};

// Cálculo de esfuerzo por etapa
// src/utils/progressCalculations.ts
export const calculateStageProgress = (entregables: Entregable[]): number => {
    if (!entregables?.length) return 0;
    
    // 1. Cálculo de horas totales estimadas
    const totalEstimated = calcularHorasEstimadas(entregables);
    if (totalEstimated === 0) return 0;

    // 2. Cálculo de valor completado
    const completedValue = calcularValorCompletado(entregables);

    // 3. Cálculo final de progreso
    return Math.round((completedValue / totalEstimated) * 100);
};

// Función auxiliar para horas estimadas
const calcularHorasEstimadas = (entregables: Entregable[]): number => {
    return entregables.reduce((total, entregable) => {
        return total + entregable.stories.reduce((sumStory, story) => {
            return sumStory + (story.child_work_items?.reduce((sumItem, item) => {
                return sumItem + (Number(item.estimated_hours) || 0);
            }, 0) ?? 0);
        }, 0);
    }, 0);
};

// Función auxiliar para valor completado
const calcularValorCompletado = (entregables: Entregable[]): number => {
    return entregables.reduce((total, entregable) => {
        return total + entregable.stories.reduce((sumStory, story) => {
            const storyEstimated = story.child_work_items?.reduce((sumItem, item) => {
                return sumItem + (Number(item.estimated_hours) || 0);
            }, 0) ?? 0;
            
            const storyProgress = calculateUSProgress(story.child_work_items ?? []);
            return sumStory + (storyProgress / 100) * storyEstimated;
        }, 0);
    }, 0);
};

// Cálculo de progreso general del proyecto
export const calculateOverallProgress = (userStories: WorkItem[]): number => {
    // Calcular horas totales estimadas y completadas
    const { totalEstimated, totalCompleted } = userStories.reduce(
        (acc, story) => {
            const estimated = story.child_work_items?.reduce(
                (sum, item) => sum + (Number(item.estimated_hours) || 0),
                0
            ) ?? 0;
            
            const completed = story.child_work_items
                ?.filter(item => item.state === "Closed")
                .reduce((sum, item) => sum + (Number(item.estimated_hours) || 0), 0) ?? 0;

            return {
                totalEstimated: acc.totalEstimated + estimated,
                totalCompleted: acc.totalCompleted + completed
            };
        },
        { totalEstimated: 0, totalCompleted: 0 }
    );

    if (totalEstimated === 0) return 0;
    return Math.round((totalCompleted / totalEstimated) * 100);
};