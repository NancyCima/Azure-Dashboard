interface ProgressBarProps {
  percentage: number;
  showPercentage?: boolean;
  ariaLabel?: string;
}

const ProgressBar = ({ 
  percentage, 
  showPercentage = true, 
  ariaLabel 
}: ProgressBarProps) => {
  const progressColor = percentage === 100 
    ? 'bg-green-600' 
    : percentage > 100 
      ? 'bg-red-600' 
      : 'bg-blue-600';
  
  const textColor = percentage === 100 
    ? 'text-green-700' 
    : percentage > 100 
      ? 'text-red-700' 
      : 'text-blue-700';

  return (
    <div className="w-full" role="progressbar" aria-valuenow={percentage} aria-label={ariaLabel}>
      {showPercentage && (
        <div className="flex justify-between mb-1">
          <span className={`text-sm font-medium ${textColor}`}>
            {percentage}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;