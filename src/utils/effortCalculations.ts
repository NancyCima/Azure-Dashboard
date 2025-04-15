import { WorkItem } from "../services/api";
import { ponderaciones } from "./ponderacionesData";

export const calculateEffort = (stories: WorkItem[]) => {
    const [originalEstimated, correctedEstimated, completedHours, weightedHours] = stories.reduce(
        ([orig, corr, comp, pond], story) => {
            const childItems = story.child_work_items || [];
            const storyEffort = childItems.reduce((acc, item) => {
                const estimated = Number(item.estimated_hours ?? 0);
                const corrected = Number(item.new_estimate ?? item.estimated_hours ?? 0);
                const rawCompleted = item.completed_hours;
                let completed = 0;

                if (
                    rawCompleted !== null &&
                    rawCompleted !== undefined &&
                    !isNaN(Number(rawCompleted)) &&
                    Number(rawCompleted) >= 0 // Asegurar no negativos
                ) {
                    completed = Number(rawCompleted);
                } else {
                    completed = 0; // Forzar 0 en casos inválidos
                }
                
                //const looseTasks = workitems.filter(item => 
                //    (item.type === "Task" || item.type === "Technical Challenge") && 
                //    !item.parentId // Si no tienen parent_id, son sueltos
                //);
                //console.log('looseTasks', looseTasks)

                // Obtener el nombre del asignado y limpiar posibles espacios extra
                const asignado = (item.assignedTo || '').trim();
                const factor = ponderaciones[asignado] || 1; // Usar 1 si no encuentra el nombre
                
                return {
                  orig: acc.orig + estimated,
                  corr: acc.corr + corrected,
                  comp: acc.comp + completed,
                  pond: acc.pond + (completed * factor)
                };
              }, { orig: 0, corr: 0, comp: 0, pond: 0 });
        
              return [
                orig + storyEffort.orig,
                corr + storyEffort.corr,
                comp + storyEffort.comp,
                pond + storyEffort.pond
              ];
            }, 
            [0, 0, 0, 0]
          );

    return {
        estimated: Math.round(originalEstimated),
        corrected: Math.round(correctedEstimated),
        completed: Math.round(completedHours),
        weighted: Math.round(weightedHours)
    };
};