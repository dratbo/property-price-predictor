export const MIN_YEAR_BUILT = 1901;
export const MAX_YEAR_BUILT = 2026;

export function maxYearBuilt() {
    return MAX_YEAR_BUILT;
}

export function validateYearBuilt(yearStr) {
    if (yearStr === '') {
        return null;
    }
    const year = parseInt(yearStr, 10);
    const maxYear = maxYearBuilt();
    if (Number.isNaN(year) || year < MIN_YEAR_BUILT || year > maxYear) {
        return `Год постройки: укажите число от ${MIN_YEAR_BUILT} до ${maxYear}`;
    }
    return null;
}

export function parseOptionalYear(value) {
    if (value === '') return undefined;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
}
