package repository

import (
	"sync"
)

type FavoriteRepository interface {
	Add(userID, propertyID int) error
	Remove(userID, propertyID int) error
	GetByUser(userID int) ([]int, error) // возвращает список ID свойств
	IsFavorite(userID, propertyID int) (bool, error)
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

func (r *InMemoryFavoriteRepo) GetByUser(userID int) ([]int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	userFavs, ok := r.favorites[userID]
	if !ok {
		return []int{}, nil
	}
	result := make([]int, 0, len(userFavs))
	for pid := range userFavs {
		result = append(result, pid)
	}
	return result, nil
}

func (r *InMemoryFavoriteRepo) IsFavorite(userID, propertyID int) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	userFavs, ok := r.favorites[userID]
	if !ok {
		return false, nil
	}
	_, exists := userFavs[propertyID]
	return exists, nil
}
