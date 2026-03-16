package repository

import (
	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"sync"
	"time"
)

type UserRepository interface {
	Create(user *models.User) error
	FindByEmail(email string) (*models.User, error)
	FindByID(id int) (*models.User, error)
}

type InMemoryUserRepo struct {
	mu         sync.RWMutex
	users      map[int]*models.User
	emailIndex map[string]int
	nextID     int
}

func NewInMemoryUserRepo() *InMemoryUserRepo {
	return &InMemoryUserRepo{
		users:      make(map[int]*models.User),
		emailIndex: make(map[string]int),
		nextID:     1,
	}
}

func (r *InMemoryUserRepo) Create(user *models.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	user.ID = r.nextID
	user.CreatedAt = time.Now()
	r.users[user.ID] = user
	r.emailIndex[user.Email] = user.ID
	r.nextID++
	return nil
}

func (r *InMemoryUserRepo) FindByEmail(email string) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	id, ok := r.emailIndex[email]
	if !ok {
		return nil, nil // not found
	}
	user := r.users[id]
	return user, nil
}

func (r *InMemoryUserRepo) FindByID(id int) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	user, ok := r.users[id]
	if !ok {
		return nil, nil
	}
	return user, nil
}
