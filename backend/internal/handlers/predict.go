package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/dratbo/property-price-predictor/backend/internal/models"
)

type PredictHandler struct {
	mlServiceURL string
	httpClient   *http.Client
}

func NewPredictHandler(mlServiceURL string) *PredictHandler {
	return &PredictHandler{
		mlServiceURL: mlServiceURL,
		httpClient:   &http.Client{Timeout: 60 * time.Second},
	}
}

func (h *PredictHandler) Predict(w http.ResponseWriter, r *http.Request) {
	var req models.PredictRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.Area <= 0 || req.Rooms <= 0 || req.City == "" {
		http.Error(w, "area, rooms and city are required", http.StatusBadRequest)
		return
	}

	body, err := json.Marshal(req)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	resp, err := h.httpClient.Post(
		h.mlServiceURL+"/predict",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		log.Printf("ML service error: %v", err)
		http.Error(w, `{"detail":"ml service unavailable"}`, http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(resp.StatusCode)
		w.Write(respBody)
		return
	}
	w.Write(respBody)
}
