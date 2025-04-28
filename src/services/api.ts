import axios from 'axios';

const BACK_URL = import.meta.env.VITE_BACK_URL;

export interface WorkItem {
    id: number;
    title: string;
    state: string;
    etapa: string;
    allEtapas: string[];
    entregable: string;
    allEntregables: string[];
    assignedTo: string;
    type: string;
    changedDate: string;
    description: string;
    acceptance_criteria: string;
    image_url?: string;
    work_item_url: string;
    storyPoints?: string | number;
    estimated_hours?: number;
    new_estimate?: number | string;
    completed_hours?: number;
    dueDate?: string;
    tags?: string[];
    child_links?: string[];
    parentId?: number;
    child_work_items?: WorkItem[];
    childIds?: number[];
    analysis?: {
      suggestedCriteria: string[];
      imageAnalysis?: string;
      generalSuggestions?: string[];
      requiresRevision: boolean;
    } | null;
}

export interface AIAnalysisResponse {
  analysis: string;
  suggestedCriteria: string[];
  generalSuggestions: string[];
  requiresRevision: boolean;
}

export const api = {
  getTotalesRealesPorAsignados: async (asignados: string[]): Promise<number> => {
    try {
      const response = await axios.post(`${BACK_URL}/total-reales-por-asignados`, { asignados });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch real totals by assignees: ${errorMessage}`);
    }
  },

  getWorkitems: async (): Promise<WorkItem[]> => {
    try {
      const response = await axios.get(`${BACK_URL}/workitems`);
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch tickets: ${errorMessage}`);
    }
  },

  analizeWorkitem: async (
    ticket: WorkItem,
    images?: File[]
  ): Promise<AIAnalysisResponse> => {
    try {
      const formData = new FormData();
      // Se envían solo los campos necesarios
      formData.append('ticket', JSON.stringify({
        title: ticket.title,
        description: ticket.description,
        work_item_type: ticket.type,
        state: ticket.state,
        acceptance_criteria: ticket.acceptance_criteria,
      }));
      
      // Si se envían imagenes, se añade al FormData (campo 'files')
      if (images && images.length > 0) {
        images.forEach((image) => {
          formData.append('files', image); // Misma clave para múltiples archivos
        });
      }

      const response = await axios.post(`${BACK_URL}/analyze-ticket`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // El back-end retorna un objeto con { status, criteria }
      return response.data.criteria;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Si el error viene del back-end, se muestra el mensaje específico
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
    images: Array<{ id: string, filename: string }>,
    figma_link?: string
  }> => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      if (figmaLink) {
        formData.append('figma_link', figmaLink);
      }

      const response = await axios.post(
        `${BACK_URL}/upload-images/${workItemId}`, 
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
  }
};