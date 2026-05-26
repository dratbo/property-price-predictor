package repository

import (
	"sync"

	"github.com/dratbo/property-price-predictor/backend/internal/models"
)

type FavoriteRepository interface {
	Add(userID, propertyID int) error
	Remove(userID, propertyID int) error
	GetPropertiesByUser(userID int) ([]*models.Property, error)
}

type InMemoryFavoriteRepo struct {
	mu sync.RWMutex
	// ключ: userID, значение: множество propertyID (map[int]bool)
	favorites map[int]map[int]bool
}

func NewInMemoryFavoriteRepo() *InMemoryFavoriteRepo {
	return &InMemoryFavoriteRepo{
		favorites: make(map[int]map[int]bool),
	}
}

func (r *InMemoryFavoriteRepo) Add(userID, propertyID int) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.favorites[userID]; !ok {
		r.favorites[userID] = make(map[int]bool)
	}
	r.favorites[userID][propertyID] = true
	return nil
}

func (r *InMemoryFavoriteRepo) Remove(userID, propertyID int) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if userFavs, ok := r.favorites[userID]; ok {
		delete(userFavs, propertyID)
		if len(userFavs) == 0 {
			delete(r.favorites, userID)
		}
	}
	return nil
}

func (r *InMemoryFavoriteRepo) GetPropertiesByUser(userID int) ([]*models.Property, error) {
	return nil, nil
}
