package handlers

import (
	"encoding/json"
	"github.com/dratbo/property-price-predictor/backend/internal/ml"
	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"github.com/dratbo/property-price-predictor/backend/internal/repository"
	"net/http"
)

type PredictHandler struct {
	propRepo repository.PropertyRepository
}

func NewPredictHandler(pr repository.PropertyRepository) *PredictHandler {
	return &PredictHandler{propRepo: pr}
}

func (h *PredictHandler) Predict(w http.ResponseWriter, r *http.Request) {
	var req models.PredictRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// Получаем все объекты для обучения
	props, err := h.propRepo.GetAll()
	if err != nil {
		http.Error(w, "failed to get properties", http.StatusInternalServerError)
		return
	}

	predictor := ml.NewPredictor(props)
	price, err := predictor.Predict(req.Area, req.Rooms)
	if err != nil {
		http.Error(w, "prediction failed", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(models.PredictResponse{PredictedPrice: price})
}
