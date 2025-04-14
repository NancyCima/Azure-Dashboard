interface Stage {
    id: number;
    name: string;
    entregableRange: {
        start: number;
        end: number;
    };
    dueDate: string;
    startDate: string;
}

export const stages: Stage[] = [
    { 
        id: 1, 
        name: 'Etapa 1', 
        entregableRange: { start: 0, end: 13 }, 
        dueDate: '2025-05-23',
        startDate: '2025-01-03',
    },
    { 
        id: 2, 
        name: 'Etapa 2', 
        entregableRange: { start: 14, end: 34 }, 
        dueDate: '2025-09-26',
        startDate: '-',
    },
    { 
        id: 3, 
        name: 'Etapa 3', 
        entregableRange: { start: 35, end: 55 }, 
        dueDate: '2025-12-19',
        startDate: '-',
    },
    { 
        id: 4, 
        name: 'Etapa 4', 
        entregableRange: { start: 56, end: 70 }, 
        dueDate: '2026-02-27',
        startDate: '-',
    }
];

export type { Stage };