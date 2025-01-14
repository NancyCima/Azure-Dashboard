import { UserStory } from '../types/UserStory';

export class AzureDevOpsService {
  private organizationUrl: string;
  private pat: string;

  constructor(organizationUrl: string, pat: string) {
    if (!organizationUrl.startsWith('https://dev.azure.com/')) {
      throw new Error('Organization URL must start with https://dev.azure.com/');
    }
    this.organizationUrl = organizationUrl.replace(/\/$/, '');
    
    if (!pat || pat.length < 30) {
      throw new Error('Invalid Personal Access Token');
    }
    this.pat = pat;
  }

  private getHeaders() {
    const basicAuth = btoa(`:${this.pat}`);
    return {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async handleResponse(response: Response, errorMessage: string) {
    if (!response.ok) {
      let message = errorMessage;
      try {
        const errorData = await response.json();
        message = errorData.message || errorData.error?.message || errorMessage;
      } catch {
        message = `${errorMessage} (Status: ${response.status})`;
      }
      throw new Error(message);
    }
    return response.json();
  }

  private parseAcceptanceCriteria(criteria: string | null): string[] {
    if (!criteria) return [];
    
    // Split by newlines and clean up each line
    const lines = criteria
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Detect if the line contains a bullet point or starts with a hyphen
    return lines.map(line => {
      const bulletIndex = line.indexOf('•');
      const hyphenIndex = line.indexOf('-');
      
      if (bulletIndex !== -1) {
        return line.substring(bulletIndex + 1).trim();
      } else if (hyphenIndex === 0) {
        return line.substring(1).trim();
      }
      return line.trim();
    }).filter(Boolean);
  }

  async getUserStories(project: string): Promise<UserStory[]> {
    if (!project) {
      throw new Error('Project name is required');
    }

    try {
      // Validate project exists
      const projectUrl = `${this.organizationUrl}/_apis/projects/${encodeURIComponent(project)}?api-version=7.0`;
      const projectResponse = await fetch(projectUrl, {
        headers: this.getHeaders(),
      });
      
      if (!projectResponse.ok) {
        throw new Error('Project not found or access denied');
      }

      // Query work items
      const wiqlUrl = `${this.organizationUrl}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.0`;
      const wiqlQuery = {
        query: `SELECT [System.Id], [System.Title], [System.Description], [System.WorkItemType], [System.State], [System.AssignedTo], [Microsoft.VSTS.Common.Priority], [Microsoft.VSTS.Common.AcceptanceCriteria]
                FROM WorkItems 
                WHERE [System.WorkItemType] = 'User Story'
                ORDER BY [System.CreatedDate] DESC`
      };

      const wiqlResponse = await fetch(wiqlUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(wiqlQuery),
      });

      const wiqlData = await this.handleResponse(wiqlResponse, 'Failed to query work items');
      
      if (!wiqlData.workItems?.length) {
        return [];
      }

      const ids = wiqlData.workItems.map((item: any) => item.id).join(',');
      const workItemsUrl = `${this.organizationUrl}/_apis/wit/workitems?ids=${ids}&$expand=relations&api-version=7.0`;
      
      const workItemsResponse = await fetch(workItemsUrl, {
        headers: this.getHeaders(),
      });

      const workItemsData = await this.handleResponse(workItemsResponse, 'Failed to fetch work items details');

      return workItemsData.value.map((item: any) => {
        const acceptanceCriteria = this.parseAcceptanceCriteria(
          item.fields['Microsoft.VSTS.Common.AcceptanceCriteria']
        );

        return {
          id: item.id.toString(),
          title: item.fields['System.Title'] || 'Untitled',
          description: item.fields['System.Description'] || '',
          acceptanceCriteria,
          state: item.fields['System.State'] || 'New',
          assignedTo: item.fields['System.AssignedTo']?.displayName,
          priority: item.fields['Microsoft.VSTS.Common.Priority'],
        };
      });

    } catch (error) {
      console.error('Error fetching user stories:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch user stories');
    }
  }

  async updateAcceptanceCriteria(storyId: string, criteria: string[]): Promise<void> {
    if (!storyId) {
      throw new Error('Story ID is required');
    }

    try {
      const url = `${this.organizationUrl}/_apis/wit/workitems/${storyId}?api-version=7.0`;
      
      const operations = [
        {
          op: 'add',
          path: '/fields/Microsoft.VSTS.Common.AcceptanceCriteria',
          value: criteria.map(c => `• ${c}`).join('\n')
        }
      ];

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json-patch+json'
        },
        body: JSON.stringify(operations)
      });

      await this.handleResponse(response, 'Failed to update acceptance criteria');
    } catch (error) {
      console.error('Error updating acceptance criteria:', error);
      throw error instanceof Error ? error : new Error('Failed to update acceptance criteria');
    }
  }
}