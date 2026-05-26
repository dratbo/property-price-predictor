package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"github.com/dratbo/property-price-predictor/backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

type PropertyHandler struct {
	propertyRepo repository.PropertyRepository
	mlServiceURL string
}

func NewPropertyHandler(pr repository.PropertyRepository, mlServiceURL string) *PropertyHandler {
	return &PropertyHandler{propertyRepo: pr, mlServiceURL: mlServiceURL}
}

func (h *PropertyHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePropertyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.Address == "" || req.City == "" || req.Area <= 0 || req.Rooms <= 0 || req.Price <= 0 {
		http.Error(w, "invalid fields", http.StatusBadRequest)
		return
	}

	prop := &models.Property{
		Address:      req.Address,
		City:         req.City,
		District:     req.District,
		Metro:        req.Metro,
		Area:         req.Area,
		Rooms:        req.Rooms,
		Floor:        req.Floor,
		TotalFloors:  req.TotalFloors,
		BuildingType: req.BuildingType,
		YearBuilt:    req.YearBuilt,
		Developer:    req.Developer,
		RepairType:   req.RepairType,
		Price:        req.Price,
		SourceURL:    req.SourceURL,
	}
	if err := h.propertyRepo.Create(prop); err != nil {
		http.Error(w, "failed to create property", http.StatusInternalServerError)
		return
	}

	go triggerRetrain(h.mlServiceURL)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(prop)
}

func (h *PropertyHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	props, err := h.propertyRepo.GetAll()
	if err != nil {
		http.Error(w, "failed to get properties", http.StatusInternalServerError)
		return
	}
	if props == nil {
		props = []*models.Property{}
	}
	json.NewEncoder(w).Encode(props)
}

func (h *PropertyHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	prop, err := h.propertyRepo.GetByID(id)
	if err != nil || prop == nil {
		http.Error(w, "property not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(prop)
}

func triggerRetrain(mlURL string) {
	body := bytes.NewBufferString(`{}`)
	http.Post(mlURL+"/retrain", "application/json", body)
}
