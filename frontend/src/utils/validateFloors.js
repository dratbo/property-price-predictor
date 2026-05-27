export const MIN_FLOOR = 1;
export const MAX_FLOOR = 100;
export const MIN_TOTAL_FLOORS = 1;
export const MAX_TOTAL_FLOORS = 75;

export function validateFloors(floorStr, totalFloorsStr) {
    const floor = floorStr === '' ? null : parseInt(floorStr, 10);
    const totalFloors = totalFloorsStr === '' ? null : parseInt(totalFloorsStr, 10);

    if (floorStr !== '' && (Number.isNaN(floor) || floor < MIN_FLOOR || floor > MAX_FLOOR)) {
        return `Этаж: укажите число от ${MIN_FLOOR} до ${MAX_FLOOR}`;
    }
    if (
        totalFloorsStr !== '' &&
        (Number.isNaN(totalFloors) || totalFloors < MIN_TOTAL_FLOORS || totalFloors > MAX_TOTAL_FLOORS)
    ) {
        return `Этажей в доме: укажите число от ${MIN_TOTAL_FLOORS} до ${MAX_TOTAL_FLOORS}`;
    }
    if (floor != null && totalFloors != null && floor > totalFloors) {
        return 'Этаж не может быть больше числа этажей в доме';
    }
    return null;
}

export function parseOptionalFloor(value) {
    if (value === '') return undefined;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
}
