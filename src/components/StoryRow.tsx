import React from 'react';
import { ChevronDown, ChevronRight, Flame, Calendar, Clock, User } from 'lucide-react';
import { WorkItem } from '../services/api';
import ProgressBar from './ProgressBar';
import EffortComparison from './EffortComparison';
import { WorkItemLink } from './common/WorkItemLink';
import { formatDate } from '../utils/dateUtils';
import { calculateWorkItemProgress } from '../utils/progressCalculations';

interface StoryRowProps {
  story: WorkItem;
  expanded: boolean;
  onToggle: () => void;
  progress: number;
}

const WorkItemRow = ({ item }: { item: WorkItem }) => {
    const isQaTask = item.type === 'QA Task';
    const itemProgress = calculateWorkItemProgress(item);

    return (
      <tr className="bg-gray-50 border-l-4 border-blue-100">
        {/* ID Column for Work Item */}
        <td className="px-2 py-3">
          <div className="flex items-center ml-6">
            {isQaTask && <Flame className="w-4 h-4 mr-1 text-yellow-500" />}
            <span className="font-medium text-gray-600">#{item.id}</span>
            <WorkItemLink url={item.work_item_url} />
          </div>
        </td>
        
        {/* Title Column for Work Item */}
        <td className="px-2 py-3">
          <span className="text-gray-600 line-clamp-1">
            {item.title}
          </span>
        </td>
        
        {/* State Column for Work Item */}
        <td className="px-2 py-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {item.state}
          </span>
        </td>
        
        {/* Assigned To Column for Work Item */}
        <td className="px-2 py-3 w-[15%]">
          <div className="flex items-center text-gray-500">
            <User className="w-4 h-4 mr-1" />
            <span className="truncate max-w-[120px]">{item.assignedTo ?? 'No asignado'}</span>
          </div>
        </td>
        
        {/* Due Date Column for Work Item */}
        <td className="px-2 py-3 w-[15%]">
          <div className="flex items-center text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(item.dueDate)}
          </div>
        </td>
        
        {/* Effort Column for Work Item */}
        <td className="px-2 py-3">
          <div className="flex items-center gap-4">
            {/* Est */}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-600">Est:</span>
                <span className="text-sm text-gray-600">
                  {Number(item.estimated_hours ?? 0).toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    useGrouping: true
                  })}
                </span>
                <span className="text-sm text-gray-600">h</span>
              </div>
            </div>

            {/* Corr */}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-600">Corr:</span>
                <span className="text-sm text-gray-600">
                  {Number(item.new_estimate ?? item.estimated_hours).toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    useGrouping: true
                  })}
                </span>
                <span className="text-sm text-gray-600">h</span>
              </div>
            </div>

            {/* Real */}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-600">Real:</span>
                <span className="text-sm text-gray-600">
                  {Number(item.completed_hours ?? 0).toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    useGrouping: true
                  })}
                </span>
                <span className="text-sm text-gray-600">h</span>
              </div>
            </div>
          </div>
        </td>
        
        {/* Progress Column for Work Item */}
        <td className="px-2 py-3">
          <ProgressBar 
            percentage={itemProgress}
          />
        </td>
      </tr>
    );
  };

const StoryRow = ({ 
  story,
  expanded,
  onToggle,
  progress,
}: StoryRowProps) => {

  return (
    <React.Fragment>
      <tr 
        className="hover:bg-blue-50 cursor-pointer"
        onClick={onToggle}
      >
        {/* ID Column */}
        <td className="px-2 py-3 w-[8%]">
          <div className="flex items-center">
            {expanded 
              ? <ChevronDown className="w-4 h-4 mr-1 text-blue-600" />
              : <ChevronRight className="w-4 h-4 mr-1 text-blue-600" />
            }
            <span className="font-medium text-blue-800">#{story.id}</span>
            <WorkItemLink url={story.work_item_url} />
          </div>
        </td>

        {/* Title Column */}
        <td className="px-2 py-3 w-[25%]">
          <span className="text-gray-900 line-clamp-2">{story.title}</span>
        </td>
        
        {/* State Column */}
        <td className="px-2 py-3 w-[10%]">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {story.state}
          </span>
        </td>
        
        {/* Assigned To Column */}
        <td className="px-2 py-3 w-[15%]">
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-1" />
            <span className="truncate max-w-[120px]">{story.assignedTo ?? 'No asignado'}</span>
          </div>
        </td>
        
        {/* Due Date Column */}
        <td className="px-2 py-3 w-[15%]">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(story.dueDate)}
          </div>
        </td>
        
        {/* Effort Column */}
        <td className="px-2 py-3 w-[12%]">
          <EffortComparison story={story} />
        </td>
        
        {/* Progress Column */}
        <td className="px-2 py-3 w-[15%]">
          <div className="w-full">
            <ProgressBar 
              percentage={progress} 
            />
          </div>
        </td>
      </tr>
      
      {/* Expanded Work Items */}
      {expanded && story.child_work_items?.map(item => (
        <WorkItemRow key={item.id} item={item} />
      ))}
    </React.Fragment>
  );
};

export default React.memo(StoryRow);