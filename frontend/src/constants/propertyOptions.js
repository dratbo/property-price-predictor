export const ANY_VALUE = '';
export const ANY_LABEL = 'любой';

export const COMMON_DEVELOPERS = [
    'ПИК',
    'Самолёт',
    'ЛСР',
    'Ак Барс',
    'Донстрой',
    'СЗ Столица',
    'Эталон',
    'Брусника',
];

import { DISTRICT_ZONES } from './districtZones';

export const COMMON_DISTRICTS = DISTRICT_ZONES;

export const COMMON_BUILDING_TYPES = [
    'кирпичный',
    'панельный',
    'монолитный',
    'кирпично-монолитный',
];

/** Порядок: от более дорогого ремонта к более дешёвому */
export const COMMON_REPAIR_TYPES = [
    'дизайнерский',
    'евроремонт',
    'косметический',
    'чистовая',
    'требует ремонта',
];

export const COMMON_BUILDING_REPAIR_TYPES = [
    'капитальный',
    'косметический',
    'свежий',
    'без ремонта',
];

export const DEFAULT_CITY_FILTERS = {
    developers: COMMON_DEVELOPERS,
    districts: COMMON_DISTRICTS,
    building_types: COMMON_BUILDING_TYPES,
    repair_types: COMMON_REPAIR_TYPES,
    building_repair_types: COMMON_BUILDING_REPAIR_TYPES,
};

export function pickOptions(apiList, fallback) {
    return apiList?.length > 0 ? apiList : fallback;
}

export function optionalChoice(value) {
    if (!value || value === ANY_LABEL) {
        return undefined;
    }
    return value;
}

/** Сброс полей-списков при смене города */
export const CITY_FILTER_FIELDS = [
    'district',
    'building_type',
    'developer',
    'repair_type',
    'building_repair_type',
];

export function resetCityFilterFields(form, city) {
    const reset = { city };
    for (const field of CITY_FILTER_FIELDS) {
        reset[field] = ANY_VALUE;
    }
    return { ...form, ...reset };
}
