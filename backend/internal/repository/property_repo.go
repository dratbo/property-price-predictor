package repository

import (
	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"sync"
	"time"
)

type PropertyRepository interface {
	Create(property *models.Property) error
	GetPage(page, limit int, filters models.PropertyListFilters) ([]*models.Property, int, error)
	GetByID(id int) (*models.Property, error)
	GetCityFilters(city string) (*models.CityFilters, error)
}

type InMemoryPropertyRepo struct {
	mu     sync.RWMutex
	props  map[int]*models.Property
	nextID int
}

func NewInMemoryPropertyRepo() *InMemoryPropertyRepo {
	return &InMemoryPropertyRepo{
		props:  make(map[int]*models.Property),
		nextID: 1,
	}
}

func (r *InMemoryPropertyRepo) Create(prop *models.Property) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	prop.ID = r.nextID
	prop.CreatedAt = time.Now()
	r.props[prop.ID] = prop
	r.nextID++
	return nil
}

func matchesListFilters(p *models.Property, f models.PropertyListFilters) bool {
	if f.City != "" && p.City != f.City {
		return false
	}
	if f.District != "" && (p.District == nil || *p.District != f.District) {
		return false
	}
	if f.BuildingType != "" && (p.BuildingType == nil || *p.BuildingType != f.BuildingType) {
		return false
	}
	if f.Developer != "" && (p.Developer == nil || *p.Developer != f.Developer) {
		return false
	}
	if f.RepairType != "" && (p.RepairType == nil || *p.RepairType != f.RepairType) {
		return false
	}
	if f.BuildingRepairType != "" && (p.BuildingRepairType == nil || *p.BuildingRepairType != f.BuildingRepairType) {
		return false
	}
	if f.Rooms != nil && p.Rooms != *f.Rooms {
		return false
	}
	if f.Area != nil {
		rounded := int(*f.Area + 0.5)
		propRounded := int(p.Area + 0.5)
		if propRounded != rounded {
			return false
		}
	}
	if f.Floor != nil && (p.Floor == nil || *p.Floor != *f.Floor) {
		return false
	}
	if f.TotalFloors != nil && (p.TotalFloors == nil || *p.TotalFloors != *f.TotalFloors) {
		return false
	}
	if f.YearBuilt != nil && (p.YearBuilt == nil || *p.YearBuilt != *f.YearBuilt) {
		return false
	}
	return true
}

func (r *InMemoryPropertyRepo) GetPage(page, limit int, filters models.PropertyListFilters) ([]*models.Property, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	all := make([]*models.Property, 0, len(r.props))
	for _, p := range r.props {
		if matchesListFilters(p, filters) {
			all = append(all, p)
		}
	}
	total := len(all)
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit
	if offset >= total {
		return []*models.Property{}, total, nil
	}
	end := offset + limit
	if end > total {
		end = total
	}
	return all[offset:end], total, nil
}

func (r *InMemoryPropertyRepo) GetCityFilters(city string) (*models.CityFilters, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	filters := &models.CityFilters{
		Developers:          []string{},
		Districts:           []string{},
		BuildingTypes:       []string{},
		RepairTypes:         []string{},
		BuildingRepairTypes: []string{},
	}
	add := func(target *[]string, seen map[string]struct{}, value *string) {
		if value == nil || *value == "" {
			return
		}
		if _, ok := seen[*value]; ok {
			return
		}
		seen[*value] = struct{}{}
		*target = append(*target, *value)
	}
	devSeen := make(map[string]struct{})
	distSeen := make(map[string]struct{})
	btSeen := make(map[string]struct{})
	rtSeen := make(map[string]struct{})
	brtSeen := make(map[string]struct{})
	for _, p := range r.props {
		if p.City != city {
			continue
		}
		add(&filters.Developers, devSeen, p.Developer)
		add(&filters.Districts, distSeen, p.District)
		add(&filters.BuildingTypes, btSeen, p.BuildingType)
		add(&filters.RepairTypes, rtSeen, p.RepairType)
		add(&filters.BuildingRepairTypes, brtSeen, p.BuildingRepairType)
	}
	return filters, nil
}

func (r *InMemoryPropertyRepo) GetByID(id int) (*models.Property, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	prop, ok := r.props[id]
	if !ok {
		return nil, nil
	}
	return prop, nil
}
