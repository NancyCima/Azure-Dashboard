import React, { useState, useEffect } from 'react';
import { AzureDevOpsService } from './services/azureDevOps';
import { UserStoryList } from './components/UserStoryList';
import { AcceptanceCriteriaForm } from './components/AcceptanceCriteriaForm';
import { Modal } from './components/Modal';
import { UserStory } from './types/UserStory';
import { Settings, AlertCircle } from 'lucide-react';

function App() {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    organizationUrl: '',
    pat: '',
    project: ''
  });

  useEffect(() => {
    const fetchStories = async () => {
      if (!isConfiguring && config.organizationUrl && config.pat && config.project) {
        setIsLoading(true);
        setError(null);
        try {
          const service = new AzureDevOpsService(config.organizationUrl, config.pat);
          const fetchedStories = await service.getUserStories(config.project);
          setStories(fetchedStories);
        } catch (error) {
          setError('Failed to fetch user stories. Please check your configuration and try again.');
          console.error('Error fetching stories:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchStories();
  }, [isConfiguring, config]);

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfiguring(false);
  };

  const handleSaveCriteria = async (criteria: string[]) => {
    if (selectedStory && config.organizationUrl && config.pat) {
      setIsLoading(true);
      setError(null);
      try {
        const service = new AzureDevOpsService(config.organizationUrl, config.pat);
        await service.updateAcceptanceCriteria(selectedStory.id, criteria);
        
        // Update local state
        const updatedStories = stories.map(story => 
          story.id === selectedStory.id 
            ? { ...story, acceptanceCriteria: criteria }
            : story
        );
        setStories(updatedStories);
        setSelectedStory({ ...selectedStory, acceptanceCriteria: criteria });
      } catch (error) {
        setError('Failed to save acceptance criteria. Please try again.');
        console.error('Error saving criteria:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isConfiguring) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">Azure DevOps Configuration</h1>
          </div>
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization URL
              </label>
              <input
                type="url"
                value={config.organizationUrl}
                onChange={(e) => setConfig({ ...config, organizationUrl: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://dev.azure.com/your-org"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Personal Access Token
              </label>
              <input
                type="password"
                value={config.pat}
                onChange={(e) => setConfig({ ...config, pat: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Project Name
              </label>
              <input
                type="text"
                value={config.project}
                onChange={(e) => setConfig({ ...config, project: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Connect to Azure DevOps
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Stories Manager</h1>
          <button
            onClick={() => setIsConfiguring(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <UserStoryList
            stories={stories}
            onSelectStory={setSelectedStory}
          />
        )}
      </div>

      <Modal
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
        title={`Criterios de Aceptación - ${selectedStory?.title}`}
      >
        {selectedStory && (
          <AcceptanceCriteriaForm
            userStory={selectedStory}
            onSave={handleSaveCriteria}
            isLoading={isLoading}
          />
        )}
      </Modal>
    </div>
  );
}

export default App;