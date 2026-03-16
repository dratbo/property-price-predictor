package handlers

import (
	"encoding/json"
	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"net/http"
	"strconv"

	"github.com/dratbo/property-price-predictor/backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

type FavoriteHandler struct {
	favRepo  repository.FavoriteRepository
	propRepo repository.PropertyRepository
}

func NewFavoriteHandler(fr repository.FavoriteRepository, pr repository.PropertyRepository) *FavoriteHandler {
	return &FavoriteHandler{
		favRepo:  fr,
		propRepo: pr,
	}
}

// AddFavorite POST /api/favorites/{id}
func (h *FavoriteHandler) Add(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int) // из middleware
	propIDStr := chi.URLParam(r, "id")
	propID, err := strconv.Atoi(propIDStr)
	if err != nil {
		http.Error(w, "invalid property id", http.StatusBadRequest)
		return
	}

	// Проверим, существует ли объект
	prop, err := h.propRepo.GetByID(propID)
	if err != nil || prop == nil {
		http.Error(w, "property not found", http.StatusNotFound)
		return
	}

	if err := h.favRepo.Add(userID, propID); err != nil {
		http.Error(w, "failed to add favorite", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "added to favorites"})
}

// RemoveFavorite DELETE /api/favorites/{id}
func (h *FavoriteHandler) Remove(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int)
	propIDStr := chi.URLParam(r, "id")
	propID, err := strconv.Atoi(propIDStr)
	if err != nil {
		http.Error(w, "invalid property id", http.StatusBadRequest)
		return
	}

	if err := h.favRepo.Remove(userID, propID); err != nil {
		http.Error(w, "failed to remove favorite", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "removed from favorites"})
}

// GetFavorites GET /api/favorites
func (h *FavoriteHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int)
	favIDs, err := h.favRepo.GetByUser(userID)
	if err != nil {
		http.Error(w, "failed to get favorites", http.StatusInternalServerError)
		return
	}

	// Загружаем полные объекты свойств по ID
	properties := []*models.Property{}
	for _, pid := range favIDs {
		prop, err := h.propRepo.GetByID(pid)
		if err != nil || prop == nil {
			continue // пропускаем, если объект вдруг удалён
		}
		properties = append(properties, prop)
	}

	json.NewEncoder(w).Encode(properties)
}
