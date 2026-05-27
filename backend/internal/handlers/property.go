package handlers

import (
	"bytes"
	"encoding/json"
	"math"
	"net/http"
	"net/url"
	"strconv"

	"github.com/dratbo/property-price-predictor/backend/internal/constants"
	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"github.com/dratbo/property-price-predictor/backend/internal/repository"
	"github.com/dratbo/property-price-predictor/backend/internal/validation"
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
	if err := validation.ValidateFloors(req.Floor, req.TotalFloors); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := validation.ValidateYearBuilt(req.YearBuilt); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
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
		RepairType:         req.RepairType,
		BuildingRepairType: req.BuildingRepairType,
		Price:              req.Price,
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

func parseOptionalIntQuery(q url.Values, key string) *int {
	v := q.Get(key)
	if v == "" {
		return nil
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return nil
	}
	return &n
}

func parseOptionalFloatQuery(q url.Values, key string) *float64 {
	v := q.Get(key)
	if v == "" {
		return nil
	}
	n, err := strconv.ParseFloat(v, 64)
	if err != nil {
		return nil
	}
	return &n
}

func parsePropertyListFilters(r *http.Request) models.PropertyListFilters {
	q := r.URL.Query()
	return models.PropertyListFilters{
		City:               q.Get("city"),
		District:           q.Get("district"),
		BuildingType:       q.Get("building_type"),
		Developer:          q.Get("developer"),
		RepairType:         q.Get("repair_type"),
		BuildingRepairType: q.Get("building_repair_type"),
		Rooms:              parseOptionalIntQuery(q, "rooms"),
		Area:               parseOptionalFloatQuery(q, "area"),
		Floor:              parseOptionalIntQuery(q, "floor"),
		TotalFloors:        parseOptionalIntQuery(q, "total_floors"),
		YearBuilt:          parseOptionalIntQuery(q, "year_built"),
	}
}

func (h *PropertyHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	listFilters := parsePropertyListFilters(r)

	props, total, err := h.propertyRepo.GetPage(page, limit, listFilters)
	if err != nil {
		http.Error(w, "failed to get properties", http.StatusInternalServerError)
		return
	}
	if props == nil {
		props = []*models.Property{}
	}
	totalPages := 0
	if total > 0 {
		totalPages = int(math.Ceil(float64(total) / float64(limit)))
	}
	json.NewEncoder(w).Encode(models.PropertyListResponse{
		Items:      props,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

func (h *PropertyHandler) GetCityFilters(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	if city == "" {
		http.Error(w, "city is required", http.StatusBadRequest)
		return
	}
	filters, err := h.propertyRepo.GetCityFilters(city)
	if err != nil {
		http.Error(w, "failed to get city filters", http.StatusInternalServerError)
		return
	}
	if filters == nil {
		filters = &models.CityFilters{}
	}
	ensureSlice := func(s []string) []string {
		if s == nil {
			return []string{}
		}
		return s
	}
	filters.Developers = ensureSlice(filters.Developers)
	filters.Districts = constants.DistrictZones
	filters.BuildingTypes = ensureSlice(filters.BuildingTypes)
	filters.RepairTypes = ensureSlice(filters.RepairTypes)
	filters.BuildingRepairTypes = ensureSlice(filters.BuildingRepairTypes)
	json.NewEncoder(w).Encode(filters)
}

func (h *PropertyHandler) GetDevelopers(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	if city == "" {
		http.Error(w, "city is required", http.StatusBadRequest)
		return
	}
	filters, err := h.propertyRepo.GetCityFilters(city)
	if err != nil {
		http.Error(w, "failed to get developers", http.StatusInternalServerError)
		return
	}
	developers := filters.Developers
	if developers == nil {
		developers = []string{}
	}
	json.NewEncoder(w).Encode(map[string][]string{"developers": developers})
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
