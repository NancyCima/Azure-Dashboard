import { WorkItem } from "../services/api";
import { ponderaciones } from "./ponderacionesData";

export const calculateEffort = (stories: WorkItem[]) => {
    // Función auxiliar para calcular esfuerzo de un ticket individual
    const calculateTicketEffort = (ticket: WorkItem) => {
        const estimated = Number(ticket.estimated_hours ?? 0);
        const corrected = Number(ticket.new_estimate ?? ticket.estimated_hours ?? 0);
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

        // Sumar esfuerzo del padre y los hijos
        return childrenEffort;
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

// En utils/effortCalculations.ts
export const calculateTeamEstimate = (stories: WorkItem[]) => {
  return stories.reduce((acc, story) => {
      return acc + (story.estimated_hours || 0);
  }, 0);
};