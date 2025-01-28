import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface AssignedTo {
    displayName: string;
}

export interface Ticket {
    id: number;
    title: string;
    state: string;
    assigned_to: AssignedTo;
    work_item_type: string;
    changed_date: string;
    description: string;
    acceptance_criteria: string;
    image_url?: string;
}

export interface UserStory {
    id: number;
    title: string;
    description: string;
    acceptanceCriteria: string;
}

export interface IncompleteTicket {
    id: number;
    title: string;
    state: string;
    description: string;
    estimatedHours: number | string; // Puede ser un número o "No disponible"
    completedHours: number | string; // Puede ser un número o "No disponible"
}

interface AIAnalysisResponse {
    analysis: string;
    suggestedCriteria: string[];
    generalSuggestions: string[];
    requiresRevision: boolean;
}

export const api = {
    getUserStories: async (): Promise<UserStory[]> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/userstories`);
            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to fetch user stories: ${errorMessage}`);
        }
    },

    getIncompleteTickets: async (): Promise<IncompleteTicket[]> => {
        const response = await axios.get(`${API_BASE_URL}/tickets`);
        return Array.isArray(response.data) ? response.data : [];
    },

    getTickets: async (): Promise<Ticket[]> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/workitems`);
            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to fetch tickets: ${errorMessage}`);
        }
    },

    analyzeTicket: async (
        ticket: Ticket,
        image?: File
    ): Promise<AIAnalysisResponse> => {
        try {
            const formData = new FormData();
            formData.append('ticket', JSON.stringify({
                title: ticket.title,
                description: ticket.description,
                work_item_type: ticket.work_item_type,
                state: ticket.state,
                acceptance_criteria: ticket.acceptance_criteria
            }));
            
            if (image) {
                formData.append('files', image);
            }

            const response = await axios.post(`${API_BASE_URL}/analyze-ticket`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data.criteria;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // Si el error viene del backend con un mensaje específico
                throw new Error(error.response.data.detail || 'Error al analizar el ticket');
            }
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            throw new Error(`Error al analizar el ticket: ${errorMessage}`);
        }
    },

    uploadImages: async (
        workItemId: number, 
        files: File[], 
        figmaLink?: string
    ): Promise<{
        work_item_id: number,
        images: Array<{id: string, filename: string}>,
        figma_link?: string
    }> => {
        try {
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));
            
            if (figmaLink) {
                formData.append('figma_link', figmaLink);
            }

            const response = await axios.post(
                `${API_BASE_URL}/upload-images/${workItemId}`, 
                formData, 
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to upload images: ${errorMessage}`);
        }
    },

    markTicketChecked: async (workItemId: number): Promise<void> => {
        try {
            await axios.post(`${API_BASE_URL}/mark-user-story-checked/${workItemId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to mark ticket as checked: ${errorMessage}`);
        }
    }

};

