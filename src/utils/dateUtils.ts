/**
 * Formatea una fecha en formato "dd/mm/yyyy" a partir de una cadena de fecha en formato ISO.
 * Si la cadena de fecha es nula o contiene "no disponible", devuelve "No disponible".
 * @param {string | undefined} dateString Cadena de fecha en formato ISO.
 * @returns {string} Cadena de fecha formateada en formato "dd/mm/yyyy" o "No disponible" si la cadena de fecha no es válida.
 */
export function formatDate(dateString: string | undefined): string {
    const invalidValues = ["", "-", "no disponible", "null", "undefined", "0", 0];

    if (dateString === '1970-01-01T00:00:00.000Z') {
        return "No disponible";
    }

    const clean = String(dateString).replace(/\s+/g, '').toLowerCase();

    if (
        (!dateString || /^(null|undefined|\-|\s*)$/i.test(dateString)) ||
        invalidValues.includes(clean)
    ) {
        return "No disponible";
    }


    // Si la fecha incluye 'Z' (UTC), la convertimos a la zona horaria local
    // Si no tiene 'Z', asumimos que es una fecha local y la parseamos como tal
    const parsedTimestamp = Date.parse(
        dateString.endsWith('Z') ? dateString : dateString + 'T00:00:00'
    );

    if (isNaN(parsedTimestamp)) {
        console.warn('Fecha inválida (parse falló):', dateString);
        return "No disponible";
    }

    const date = new Date(parsedTimestamp);

    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${date.getFullYear()}`;
}