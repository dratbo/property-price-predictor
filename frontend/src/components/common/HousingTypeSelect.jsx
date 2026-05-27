import {
    HOUSING_TYPES,
    HOUSING_TYPE_LABELS,
    HOUSING_TYPE_DEFAULT,
} from '../../constants/propertyOptions';

/** Выбор типа жилья (квартира / студия / апартаменты). */
const HousingTypeSelect = ({ label = 'Тип жилья', value, onChange, allowAny = false, required = false }) => (
    <label>
        {label}
        {required && ' *'}
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
        >
            {allowAny && <option value="">любой</option>}
            {HOUSING_TYPES.map((type) => (
                <option key={type} value={type}>
                    {HOUSING_TYPE_LABELS[type] || type}
                </option>
            ))}
        </select>
    </label>
);

export { HOUSING_TYPE_DEFAULT };
export default HousingTypeSelect;
