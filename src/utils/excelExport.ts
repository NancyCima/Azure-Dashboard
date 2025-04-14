import * as XLSX from 'xlsx';
import { WorkItem } from '../services/api';
import { formatDate } from './dateUtils';
import { cleanHtmlContent } from './htmlUtils';

// Mapeo de User Stories a formato Excel
function mapWorkItemToExcel(story: WorkItem) {
    const tags = story.tags ? story.tags.join(', ') : 'Sin etiquetas';
    return {
        ID: story.id,
        Título: story.title,
        Descripción: cleanHtmlContent(story.description) || 'No disponible',
        'Criterios de Aceptación': cleanHtmlContent(story.acceptance_criteria) || 'No disponible',
        'Story Points': story.storyPoints ?? 'No disponible',
        Estado: story.state,
        Asignado: story.assignedTo || 'No asignado',
        Tags: tags,
        'Fecha de entrega': formatDate(story.dueDate),
    };
}

// Mapeo de Otros Tickets a formato Excel
function mapTicketToExcel(ticket: WorkItem) {
    return {
        ID: ticket.id,
        Título: ticket.title,
        Tipo: ticket.type || 'No especificado',
        Estado: ticket.state,
        Asignado: ticket.assignedTo || 'No asignado',
        Descripción: cleanHtmlContent(ticket.description) || 'No disponible',
        'Estimación (Horas)': ticket.estimated_hours ?? 'No disponible',
        'Horas Completadas': ticket.completed_hours ?? 'No disponible',
    };
}

// Función para exportar datos a Excel
export function exportToExcel(
    selectedTab: 'userStories' | 'otherTickets',
    userStories: WorkItem[],
    tickets: WorkItem[]
) {
    let workbookData;

    if (selectedTab === 'userStories') {
        workbookData = userStories.map(mapWorkItemToExcel);
    } else {
        workbookData = tickets.map(mapTicketToExcel);
    }

    const worksheet = XLSX.utils.json_to_sheet(workbookData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedTab === 'userStories' ? 'User Stories' : 'Tickets');

    // Generar el archivo Excel
    XLSX.writeFile(workbook, selectedTab === 'userStories' ? 'user-stories.xlsx' : 'tickets.xlsx');
}