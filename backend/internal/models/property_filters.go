package models

// PropertyListFilters — query-параметры списка объектов.
type PropertyListFilters struct {
	City               string
	District           string
	BuildingType       string
	Developer          string
	RepairType         string
	BuildingRepairType string
	HousingType        string
	ApartmentType      string
	Rooms              *int
	Area               *float64
	Floor              *int
	TotalFloors        *int
	YearBuilt          *int
}
