package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"github.com/dratbo/property-price-predictor/backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

type FavoriteHandler struct {
	favRepo repository.FavoriteRepository
}

func NewFavoriteHandler(fr repository.FavoriteRepository) *FavoriteHandler {
	return &FavoriteHandler{favRepo: fr}
}

func (h *FavoriteHandler) Add(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int)
	propID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid property id", http.StatusBadRequest)
		return
	}
	if err := h.favRepo.Add(userID, propID); err != nil {
		http.Error(w, "failed to add favorite", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "added to favorites"})
}

func (h *FavoriteHandler) Remove(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int)
	propID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid property id", http.StatusBadRequest)
		return
	}
	if err := h.favRepo.Remove(userID, propID); err != nil {
		http.Error(w, "failed to remove favorite", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "removed from favorites"})
}

func (h *FavoriteHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int)
	properties, err := h.favRepo.GetPropertiesByUser(userID)
	if err != nil {
		http.Error(w, "failed to get favorites", http.StatusInternalServerError)
		return
	}
	if properties == nil {
		properties = []*models.Property{}
	}
	json.NewEncoder(w).Encode(properties)
}
