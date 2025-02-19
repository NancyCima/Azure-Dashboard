import * as XLSX from 'xlsx';
import { UserStory, IncompleteTicket } from '../services/api';
import { clean_html_content } from 'main.py'
import { formatDate } from './dateUtils';

// Mapeo de User Stories a formato Excel
function mapUserStoryToExcel(story: UserStory) {
    const tags =
        story.tags && story.tags !== "Sin etiquetas"
            ? story.tags.split(',').map(tag => tag.trim()).join(', ')
            : 'Sin etiquetas';
    return {
        ID: story.id,
        Título: story.title,
        Descripción: story.description || 'No disponible',
        'Criterios de Aceptación': story.acceptanceCriteria || 'No disponible',
        Estado: story.state,
        Asignado: story.assigned_to || 'No asignado',
        Tags: tags,
        'Fecha de entrega': formatDate(story.due_date),
    };
}

// Mapeo de Otros Tickets a formato Excel
function mapTicketToExcel(ticket: IncompleteTicket) {
    return {
        ID: ticket.id,
        Título: ticket.title,
        Estado: ticket.state,
        'Horas Estimadas': ticket.estimatedHours || 'No disponible',
        'Horas Completadas': ticket.completedHours || 'No disponible',
        Descripción: ticket.description.trim() || 'No disponible',
    };
}

// Función para exportar datos a Excel
export function exportToExcel(
    selectedTab: 'userStories' | 'otherTickets',
    userStories: UserStory[],
    tickets: IncompleteTicket[]
) {
    let workbookData;

    if (selectedTab === 'userStories') {
        workbookData = userStories.map(mapUserStoryToExcel);
    } else {
        workbookData = tickets.map(mapTicketToExcel);
    }

    const worksheet = XLSX.utils.json_to_sheet(workbookData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedTab === 'userStories' ? 'User Stories' : 'Tickets');

    // Generar el archivo Excel
    XLSX.writeFile(workbook, selectedTab === 'userStories' ? 'user-stories.xlsx' : 'tickets.xlsx');
}
