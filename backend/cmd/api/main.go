package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"github.com/dratbo/property-price-predictor/backend/internal/handlers"
	"github.com/dratbo/property-price-predictor/backend/internal/middleware"
	"github.com/dratbo/property-price-predictor/backend/internal/repository"
)

func main() {
	userRepo := repository.NewInMemoryUserRepo()
	propertyRepo := repository.NewInMemoryPropertyRepo()
	favoriteRepo := repository.NewInMemoryFavoriteRepo()

	authHandler := handlers.NewAuthHandler(userRepo)
	propertyHandler := handlers.NewPropertyHandler(propertyRepo)
	favoriteHandler := handlers.NewFavoriteHandler(favoriteRepo, propertyRepo)
	predictHandler := handlers.NewPredictHandler(propertyRepo)

	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// Публичные маршруты
	r.Post("/api/register", authHandler.Register)
	r.Post("/api/login", authHandler.Login)
	r.Get("/api/properties", propertyHandler.GetAll)
	r.Get("/api/properties/{id}", propertyHandler.GetByID)
	r.Post("/api/predict", predictHandler.Predict)

	// Защищённые маршруты (с JWT)
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Post("/api/properties", propertyHandler.Create)
		r.Get("/api/favorites", favoriteHandler.Get)
		r.Post("/api/favorites/{id}", favoriteHandler.Add)
		r.Delete("/api/favorites/{id}", favoriteHandler.Remove)
	})

	log.Println("Server starting on :8080")
	http.ListenAndServe(":8080", r)
}
