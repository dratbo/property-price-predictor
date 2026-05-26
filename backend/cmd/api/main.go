package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"github.com/dratbo/property-price-predictor/backend/internal/config"
	"github.com/dratbo/property-price-predictor/backend/internal/database"
	"github.com/dratbo/property-price-predictor/backend/internal/handlers"
	"github.com/dratbo/property-price-predictor/backend/internal/middleware"
	"github.com/dratbo/property-price-predictor/backend/internal/repository"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()
	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()

	userRepo := repository.NewPgUserRepo(pool)
	propertyRepo := repository.NewPgPropertyRepo(pool)
	favoriteRepo := repository.NewPgFavoriteRepo(pool)

	authHandler := handlers.NewAuthHandler(userRepo, []byte(cfg.JWTSecret))
	propertyHandler := handlers.NewPropertyHandler(propertyRepo, cfg.MLServiceURL)
	favoriteHandler := handlers.NewFavoriteHandler(favoriteRepo)
	predictHandler := handlers.NewPredictHandler(cfg.MLServiceURL)
	analyticsHandler := handlers.NewAnalyticsHandler(cfg.MLServiceURL)

	r := chi.NewRouter()
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:3000"}
	if origin := os.Getenv("FRONTEND_URL"); origin != "" {
		allowedOrigins = append(allowedOrigins, origin)
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Post("/api/register", authHandler.Register)
	r.Post("/api/login", authHandler.Login)
	r.Get("/api/properties", propertyHandler.GetAll)
	r.Get("/api/properties/{id}", propertyHandler.GetByID)
	r.Post("/api/predict", predictHandler.Predict)
	r.Get("/api/analytics/cities", analyticsHandler.Cities)
	r.Get("/api/health/ml", analyticsHandler.HealthML)

	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware([]byte(cfg.JWTSecret)))
		r.Post("/api/properties", propertyHandler.Create)
		r.Get("/api/favorites", favoriteHandler.Get)
		r.Post("/api/favorites/{id}", favoriteHandler.Add)
		r.Delete("/api/favorites/{id}", favoriteHandler.Remove)
	})

	addr := ":" + cfg.Port
	server := &http.Server{Addr: addr, Handler: r}

	go func() {
		log.Printf("Server starting on %s", addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown error: %v", err)
	}
	fmt.Println("Server stopped")
}
