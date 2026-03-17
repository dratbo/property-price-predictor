package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/dratbo/property-price-predictor/backend/internal/ml"
	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"github.com/dratbo/property-price-predictor/backend/internal/repository"
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

	props, err := h.propRepo.GetAll()
	if err != nil {
		http.Error(w, "failed to get properties", http.StatusInternalServerError)
		return
	}

	// Логируем количество полученных объектов
	log.Printf("Number of properties for prediction: %d", len(props))
	// Логируем каждый объект (для отладки)
	for i, p := range props {
		log.Printf("Property %d: ID=%d Area=%.2f Rooms=%d Price=%.2f", i, p.ID, p.Area, p.Rooms, p.Price)
	}

	predictor := ml.NewPredictor(props)
	price, err := predictor.Predict(req.Area, req.Rooms)
	if err != nil {
		log.Printf("Prediction error: %v", err)
		http.Error(w, "prediction failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(models.PredictResponse{PredictedPrice: price})
}
