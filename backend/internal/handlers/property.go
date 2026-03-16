package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"github.com/dratbo/property-price-predictor/backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

type PropertyHandler struct {
	propertyRepo repository.PropertyRepository
}

func NewPropertyHandler(pr repository.PropertyRepository) *PropertyHandler {
	return &PropertyHandler{propertyRepo: pr}
}

func (h *PropertyHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePropertyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	// Простая валидация
	if req.Address == "" || req.Area <= 0 || req.Rooms <= 0 || req.Price <= 0 {
		http.Error(w, "invalid fields", http.StatusBadRequest)
		return
	}
	prop := &models.Property{
		Address: req.Address,
		Area:    req.Area,
		Rooms:   req.Rooms,
		Price:   req.Price,
	}
	if err := h.propertyRepo.Create(prop); err != nil {
		http.Error(w, "failed to create property", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(prop)
}

func (h *PropertyHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	props, err := h.propertyRepo.GetAll()
	if err != nil {
		http.Error(w, "failed to get properties", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(props)
}

func (h *PropertyHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	prop, err := h.propertyRepo.GetByID(id)
	if err != nil {
		http.Error(w, "property not found", http.StatusNotFound)
		return
	}
	if prop == nil {
		http.Error(w, "property not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(prop)
}
