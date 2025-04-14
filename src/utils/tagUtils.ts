/**
 * Normaliza un tag para comparación:
 * - Convierte a minúsculas
 * - Elimina espacios adicionales
 * - Extrae solo el número (para Etapa/Entregable)
 */
export const normalizeTag = (tag: string): { normalized: string; number: number; original: string } => {
    const trimmed = tag.trim();
    const lower = trimmed.toLowerCase();
    
    // Extraer el número del tag (ej: "Etapa 01" -> 1)
    const numberMatch = trimmed.match(/\d+/);
    const number = numberMatch ? parseInt(numberMatch[0]) : 0;
    
    return {
        normalized: lower,
        number,
        original: trimmed // Mantenemos el formato original para mostrar
    };
};

/**
 * Encuentra todos los tags de un tipo específico (etapa/entregable)
 */
export const findTags = (tags: string[] | undefined, type: 'etapa' | 'entregable') => {
    if (!tags) return [];
    
    return tags
        .map(tag => {
            const normalized = normalizeTag(tag);
            return {
                ...normalized,
                isType: normalized.normalized.startsWith(type)
            };
        })
        .filter(tag => tag.isType)
        .map(tag => tag.original); // Devolvemos el formato original
};