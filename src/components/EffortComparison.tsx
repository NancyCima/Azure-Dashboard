import { Clock } from 'lucide-react';
import { WorkItem } from '../services/api';

interface EffortComparisonProps {
  story: WorkItem;
  factorStoryPoint?: number;
}

const EffortComparison = ({ 
    story, 
    factorStoryPoint = 8 
  }: EffortComparisonProps) => {
    if (!story.child_work_items || story.child_work_items.length === 0) {
        return (
            <span className="text-sm text-gray-500">
                No disponible
            </span>
        );
    }

    // Cálculo del estimado total
    const totalEstimatedFromWorkItems = story.child_work_items.reduce(
        (sum, item) => sum + Number(item.estimated_hours ?? 0), 0
    );

    // Estimación corregida
    const correctedEstimated = story.child_work_items.reduce(
        (sum, item) => sum + Number(item.new_estimate ?? item.estimated_hours ?? 0), 0
    );
    
    // Si no hay estimaciones en los Work Items, usar Story Points
    // Primero calculamos las horas basadas en Story Points (si aplican)
    const storyPointsHours = typeof story.storyPoints === 'number' 
    ? story.storyPoints * factorStoryPoint 
    : 0;

    // Luego determinamos el total final usando las estimaciones de Work Items como prioridad
    const estimatedHours = totalEstimatedFromWorkItems > 0 
    ? totalEstimatedFromWorkItems 
    : storyPointsHours;
    
    const actualHours = story.child_work_items.reduce(
        (sum, item) => sum + Number(item.completed_hours ?? 0), 0
    );

    const estimatedHoursRounded = estimatedHours.toLocaleString('es-ES', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2,
        useGrouping: true
      });
    const correctedEstimatedRounded = correctedEstimated.toLocaleString('es-ES', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2,
        useGrouping: true
      });
    const actualHoursRounded = actualHours.toLocaleString('es-ES', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2,
        useGrouping: true
      });
    const difference = (actualHours - estimatedHours).toLocaleString('es-ES', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2,
        useGrouping: true
      });

    return (
        <div className="grid grid-cols-[auto_auto_auto] gap-2 items-center w-full">
            <div className="flex items-center whitespace-nowrap">
                <Clock className="w-4 h-4 mr-1 text-gray-500" />
                <span className="text-sm text-gray-600">
                    Est:  {estimatedHoursRounded}h
                </span>
            </div>
            <div className="flex items-center whitespace-nowrap">
                <Clock className="w-4 h-4 mr-1 text-gray-500" />
                <span className="text-sm text-gray-600">
                    Corr: {correctedEstimatedRounded}h
                </span>
            </div>
            <div className="flex items-center whitespace-nowrap">
                <Clock className="w-4 h-4 mr-1 text-gray-500" />
                <span className="text-sm text-gray-600">
                    Real: {actualHoursRounded}h
                </span>
            </div>
            {difference !== '0.00' && (
                <span className={`text-sm flex items-center whitespace-nowrap ${Number(difference) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Number(difference) > 0 ? '+' : ''}{difference}h
                </span>
            )}
        </div>
    );
};

export default EffortComparison;