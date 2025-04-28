import { WorkItem } from "../services/api";
import { ponderaciones } from "./ponderacionesData";

export const calculateEffort = (stories: WorkItem[]) => {
    // Función auxiliar para calcular esfuerzo de un ticket individual
    const calculateTicketEffort = (ticket: WorkItem) => {
        // Solo procesar tickets que no son User Stories o que no tienen child_work_items
        if (ticket.child_work_items && ticket.child_work_items.length > 0) {
            return {
                estimated: 0,
                corrected: 0,
                completed: 0,
                weighted: 0
            };
        }

        const estimated = Number(ticket.estimated_hours ?? 0);
        const corrected = ticket.new_estimate !== null && 
                           ticket.new_estimate !== "" && 
                           !isNaN(Number(ticket.new_estimate))
            ? Number(ticket.new_estimate)
            : estimated;  // Usar estimated si new_estimate es inválido
        const completed = Number(ticket.completed_hours ?? 0);
        const asignado = (ticket.assignedTo || '').trim();
        const factor = ponderaciones[asignado] || 1;
        const weighted = completed * factor;

        return {
            estimated,
            corrected,
            completed,
            weighted
        };
    };

    // Calcular esfuerzo total incluyendo tickets hijos y el ticket padre
    const calculateTotalEffort = (story: WorkItem) => {
        // Calcular esfuerzo de los tickets hijos
        const childrenEffort = (story.child_work_items || []).reduce((acc, item) => {
            const itemEffort = calculateTicketEffort(item);
            return {
                estimated: acc.estimated + itemEffort.estimated,
                corrected: acc.corrected + itemEffort.corrected,
                completed: acc.completed + itemEffort.completed,
                weighted: acc.weighted + itemEffort.weighted
            };
        }, { estimated: 0, corrected: 0, completed: 0, weighted: 0 });

        // Si el ticket padre no tiene hijos, calcular su propio esfuerzo
        const parentEffort = calculateTicketEffort(story);

        // Sumar esfuerzo del padre y los hijos
        return {
            estimated: childrenEffort.estimated + parentEffort.estimated,
            corrected: childrenEffort.corrected + parentEffort.corrected,
            completed: childrenEffort.completed + parentEffort.completed,
            weighted: childrenEffort.weighted + parentEffort.weighted
        };
    };

    // Calcular el esfuerzo total de todas las historias
    const totalEffort = stories.reduce((acc, story) => {
        const storyEffort = calculateTotalEffort(story);
        return {
            estimated: acc.estimated + storyEffort.estimated,
            corrected: acc.corrected + storyEffort.corrected,
            completed: acc.completed + storyEffort.completed,
            weighted: acc.weighted + storyEffort.weighted
        };
    }, { estimated: 0, corrected: 0, completed: 0, weighted: 0 });

    return {
        estimated: Math.round(totalEffort.estimated),
        corrected: Math.round(totalEffort.corrected),
        completed: Math.round(totalEffort.completed),
        weighted: Math.round(totalEffort.weighted)
    };
};

export const calculateTeamEstimate = (stories: WorkItem[]) => {
    return stories.reduce((acc, story) => {
        const getValidNumber = (value: any) => 
            value !== null && value !== undefined && value !== "" && !isNaN(value) 
                ? Number(value) 
                : 0;

        if (story.child_work_items && story.child_work_items.length > 0) {
            return acc + story.child_work_items.reduce((sum, item) => {
                const estimate = getValidNumber(item.new_estimate) || getValidNumber(item.estimated_hours);
                return sum + estimate;
            }, 0);
        }
        
        const estimate = getValidNumber(story.new_estimate) || getValidNumber(story.estimated_hours);
        return acc + estimate;
    }, 0);
};