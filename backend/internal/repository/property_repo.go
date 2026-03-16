package repository

import (
	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"sync"
	"time"
)

type PropertyRepository interface {
	Create(property *models.Property) error
	GetAll() ([]*models.Property, error)
	GetByID(id int) (*models.Property, error)
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

func (r *InMemoryPropertyRepo) GetAll() ([]*models.Property, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]*models.Property, 0, len(r.props))
	for _, p := range r.props {
		result = append(result, p)
	}
	return result, nil
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
