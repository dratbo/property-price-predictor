import { useEffect, useState } from 'react';
import API from '../services/api';
import { DISTRICT_ZONES } from '../constants/districtZones';
import {
    DEFAULT_CITY_FILTERS,
    pickOptions,
} from '../constants/propertyOptions';

export function useCityFilters(city) {
    const [filters, setFilters] = useState(DEFAULT_CITY_FILTERS);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!city) {
            setFilters(DEFAULT_CITY_FILTERS);
            return;
        }
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await API.get('/city-filters', { params: { city } });
                const data = res.data ?? {};
                if (!cancelled) {
                    setFilters({
                        developers: pickOptions(data.developers, DEFAULT_CITY_FILTERS.developers),
                        districts: data.districts?.length ? data.districts : DISTRICT_ZONES,
                        building_types: pickOptions(
                            data.building_types,
                            DEFAULT_CITY_FILTERS.building_types
                        ),
                        repair_types: pickOptions(
                            data.repair_types,
                            DEFAULT_CITY_FILTERS.repair_types
                        ),
                        building_repair_types: pickOptions(
                            data.building_repair_types,
                            DEFAULT_CITY_FILTERS.building_repair_types
                        ),
                    });
                }
            } catch {
                if (!cancelled) {
                    setFilters(DEFAULT_CITY_FILTERS);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [city]);

    return { filters, loading };
}
