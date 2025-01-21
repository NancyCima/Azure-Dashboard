import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface Ticket {
    id: number;
    title: string;
    status: string;
    description?: string;
    }

    export const api = {
    getTickets: async (): Promise<Ticket[]> => {
        const response = await axios.get(`${API_BASE_URL}/api/v1/workitems/work-items`);
        return response.data;
    }
};