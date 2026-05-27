import { ANY_LABEL, ANY_VALUE } from '../../constants/propertyOptions';

const FilterSelect = ({ label, value, onChange, options, loading }) => (
    <label>
        {label}
        <select value={value} onChange={onChange} disabled={loading}>
            <option value={ANY_VALUE}>{ANY_LABEL}</option>
            {options.map((item) => (
                <option key={item} value={item}>
                    {item}
                </option>
            ))}
        </select>
    </label>
);

export default FilterSelect;
