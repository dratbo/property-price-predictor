package repository

import (
	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"sync"
	"time"
)

type PropertyRepository interface {
	Create(property *models.Property) error
	GetPage(page, limit int, city string) ([]*models.Property, int, error)
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

func (r *InMemoryPropertyRepo) GetPage(page, limit int, city string) ([]*models.Property, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	all := make([]*models.Property, 0, len(r.props))
	for _, p := range r.props {
		if city == "" || p.City == city {
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
