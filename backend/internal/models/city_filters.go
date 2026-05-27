package models

type CityFilters struct {
	Developers          []string `json:"developers"`
	Districts           []string `json:"districts"`
	BuildingTypes       []string `json:"building_types"`
	RepairTypes         []string `json:"repair_types"`
	BuildingRepairTypes []string `json:"building_repair_types"`
}
