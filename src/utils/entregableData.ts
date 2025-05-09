import { WorkItem } from '../services/api';

export interface Entregable {
    number: number;
    stories: WorkItem[];
    startDate: string;
    dueDate: string;
}

export const entregableStartDates: { [key: number]: string } = {
    0: '2024-12-31',
    1: '2025-01-02',
    2: '2025-01-02',
    3: '2025-01-02',
    4: '2025-02-14',
    5: '2025-02-28',
    6: '2025-02-28',
    7: '2025-03-14',
    8: '2025-03-14',
    9: '2025-03-14',
    10: '2025-04-14',
    11: '2025-04-28',
    12: '2025-04-28',
    13: '2025-05-12',
    14: '2025-04-28',
    15: 'No disponible',
    16: 'No disponible',
    17: 'No disponible',
    18: 'No disponible',
    19: 'No disponible',
    20: 'No disponible',
    21: 'No disponible',
    22: 'No disponible',
    23: 'No disponible',
    24: 'No disponible',
    25: 'No disponible',
    26: 'No disponible',
    27: 'No disponible',
    28: 'No disponible',
    29: 'No disponible',
    30: 'No disponible',
    31: 'No disponible',
    32: 'No disponible',
    33: 'No disponible',
    34: 'No disponible',
    35: 'No disponible',
    36: 'No disponible',
    37: 'No disponible',
    38: 'No disponible',
    39: 'No disponible',
    40: 'No disponible',
    41: 'No disponible',
    42: 'No disponible',
    43: 'No disponible',
    44: 'No disponible',
    45: 'No disponible',
    46: 'No disponible',
    47: 'No disponible',
    48: 'No disponible',
    49: 'No disponible',
    50: 'No disponible',
    51: 'No disponible',
    52: 'No disponible',
    53: 'No disponible',
    54: 'No disponible',
    55: 'No disponible',
    56: 'No disponible',
    57: 'No disponible',
    58: 'No disponible',
    59: 'No disponible',
    60: 'No disponible',
    61: 'No disponible',
    62: 'No disponible',
    63: 'No disponible',
    64: 'No disponible',
    65: 'No disponible',
    66: 'No disponible',
    67: 'No disponible',
    68: 'No disponible',
    69: 'No disponible',
};

export const entregableDueDates: { [key: number]: string } = {
    0: '2025-01-31',
    1: '2025-01-31',
    2: '2025-02-14',
    3: '2025-02-14',
    4: '2025-02-28',
    5: '2025-03-14',
    6: '2025-03-14',
    7: '2025-04-11',
    8: '2025-04-11',
    9: '2025-04-11',
    10: '2025-04-25',
    11: '2025-05-09',
    12: '2025-05-09',
    13: '2025-05-23',
    14: '2025-05-09',
    15: '2025-05-23',
    16: '2025-06-06',
    17: '2025-06-06',
    18: '2025-06-06',
    19: '2025-06-06',
    20: '2025-06-20',
    21: '2025-06-20',
    22: '2025-07-04',
    23: '2025-07-04',
    24: '2025-08-01',
    25: '2025-08-01',
    26: '2025-08-01',
    27: '2025-08-01',
    28: '2025-08-01',
    29: '2025-08-15',
    30: '2025-08-15',
    31: '2025-09-12',
    32: '2025-09-12',
    33: '2025-09-26',
    34: '2025-09-26',
    35: '2025-10-10',
    36: '2025-10-10',
    37: '2025-10-10',
    38: '2025-10-10',
    39: '2025-10-24',
    40: '2025-10-24',
    41: '2025-10-24',
    42: '2025-10-24',
    43: '2025-10-24',
    44: '2025-10-24',
    45: '2025-11-07',
    46: '2025-11-07',
    47: '2025-11-07',
    48: '2025-11-07',
    49: '2025-11-07',
    50: '2025-11-21',
    51: '2025-11-21',
    52: '2025-12-05',
    53: '2025-12-05',
    54: '2025-12-19',
    55: '2025-12-05',
    56: '2025-12-05',
    57: '2025-12-05',
    58: '2026-01-16',
    59: '2026-01-16',
    60: '2026-01-16',
    61: '2026-01-30',
    62: '2026-01-30',
    63: '2026-01-30',
    64: '2026-01-30',
    65: '2026-01-30',
    66: '2026-02-13',
    67: '2026-02-13',
    68: '2026-02-27',
    69: '2026-02-27',
};