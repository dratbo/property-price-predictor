package handlers

import (
	"encoding/json"
	"io"
	"net/http"
)

type AnalyticsHandler struct {
	mlServiceURL string
}

func NewAnalyticsHandler(mlURL string) *AnalyticsHandler {
	return &AnalyticsHandler{mlServiceURL: mlURL}
}

func (h *AnalyticsHandler) Cities(w http.ResponseWriter, r *http.Request) {
	resp, err := http.Get(h.mlServiceURL + "/analytics/cities")
	if err != nil {
		http.Error(w, "analytics service unavailable", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func (h *AnalyticsHandler) HealthML(w http.ResponseWriter, r *http.Request) {
	resp, err := http.Get(h.mlServiceURL + "/health")
	if err != nil {
		json.NewEncoder(w).Encode(map[string]any{"status": "error", "ml_available": false})
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
