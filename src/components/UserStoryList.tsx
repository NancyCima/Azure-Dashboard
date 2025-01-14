import React from 'react';
import { UserStory } from '../types/UserStory';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  stories: UserStory[];
  onSelectStory: (story: UserStory) => void;
}

export const UserStoryList: React.FC<Props> = ({ stories, onSelectStory }) => {
  const StatusIndicator = ({ condition }: { condition: boolean }) => (
    condition ? 
      <CheckCircle2 className="w-6 h-6 text-green-500" /> : 
      <XCircle className="w-6 h-6 text-red-500" />
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">User Stories</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción Completa
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Criterios de Aceptación
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stories.map((story) => {
              const hasDescription = story.description && story.description.trim() !== '';
              const hasEnoughCriteria = story.acceptanceCriteria.length > 2;

              return (
                <tr 
                  key={story.id}
                  onClick={() => onSelectStory(story)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{story.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{story.title}</div>
                    <div className="text-sm text-gray-500">
                      {story.state} {story.priority && `• P${story.priority}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center">
                      <StatusIndicator condition={hasDescription} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center items-center gap-2">
                      <StatusIndicator condition={hasEnoughCriteria} />
                      <span className="text-sm text-gray-500">
                        ({story.acceptanceCriteria.length})
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {stories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron historias de usuario que requieran atención
        </div>
      )}
    </div>
  );
}