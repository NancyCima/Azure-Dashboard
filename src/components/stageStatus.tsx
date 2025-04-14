import { WorkItem } from "../services/api";
import { getDaysUntilDelivery } from "../utils/deliveryDateUtils";
import { Stage } from "../utils/stageData";

// Determina el estado de un stage basado en los días restantes hasta 
// la fecha de entrega y lo clasifica en niveles de riesgo
export const getStageStatus = (stage: Stage, stories: WorkItem[]) => {
    // Si no hay historias, el riesgo es bajo
    if (stories.length === 0) {
        return (
            <span className="px-3 py-1 rounded-full text-sm bg-blue-300 text-white">
                Riesgo bajo
            </span>
        );
    }
    
    // Calcular los días restantes hasta la fecha de entrega
    const daysRemaining = getDaysUntilDelivery(stage.dueDate);
    
    // Determinar el estado y el color basado en los días restantes
    if (daysRemaining > 30) {
        return (
            <span className="px-3 py-1 rounded-full text-sm bg-green-500 text-white">
                Según lo previsto
            </span>
        );
    } else if (daysRemaining > 15) {
        return (
            <span className="px-3 py-1 rounded-full text-sm bg-blue-500 text-white">
                Riesgo medio
            </span>
        );
    } else {
        return (
            <span className="px-3 py-1 rounded-full text-sm bg-purple-500 text-white">
                Riesgo alto
            </span>
        );
    }
};
