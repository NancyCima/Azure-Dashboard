import React from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Save } from 'lucide-react';
import { UserStory } from '../types/UserStory';

interface Props {
  userStory: UserStory;
  onSave: (criteria: string[]) => void;
  isLoading: boolean;
}

export const AcceptanceCriteriaForm: React.FC<Props> = ({ userStory, onSave, isLoading }) => {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      criteria: userStory.acceptanceCriteria.length > 0 ? userStory.acceptanceCriteria : ['']
    }
  });

  const criteria = watch('criteria');

  const addCriterion = () => {
    setValue('criteria', [...criteria, '']);
  };

  const removeCriterion = (index: number) => {
    const newCriteria = criteria.filter((_, i) => i !== index);
    setValue('criteria', newCriteria);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{userStory.title}</h3>
        <p className="text-gray-600">{userStory.description || 'No description provided'}</p>
      </div>

      <form onSubmit={handleSubmit((data) => onSave(data.criteria))} className="space-y-4">
        <div className="space-y-4">
          {criteria.map((_, index) => (
            <div key={index} className="flex gap-2">
              <input
                {...register(`criteria.${index}`)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter acceptance criterion"
              />
              {criteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCriterion(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={addCriterion}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Criterion
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};