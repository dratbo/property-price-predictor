package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"github.com/dratbo/property-price-predictor/backend/internal/repository"
)

// Секретный ключ для JWT (в реальном проекте берите из переменных окружения)
var jwtSecret = []byte("your-secret-key")

type AuthHandler struct {
	userRepo repository.UserRepository
}

func NewAuthHandler(ur repository.UserRepository) *AuthHandler {
	return &AuthHandler{userRepo: ur}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// Проверяем, не занят ли email
	existing, _ := h.userRepo.FindByEmail(req.Email)
	if existing != nil {
		http.Error(w, "user already exists", http.StatusConflict)
		return
	}

	// Хешируем пароль
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hash),
	}

	if err := h.userRepo.Create(user); err != nil {
		http.Error(w, "failed to create user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "user created"})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.FindByEmail(req.Email)
	if err != nil || user == nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// Генерируем JWT-токен
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(models.AuthResponse{Token: tokenString})
}
