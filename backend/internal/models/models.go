package models

import "time"

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // не возвращаем в JSON
	CreatedAt    time.Time `json:"created_at"`
}

type Property struct {
	ID        int       `json:"id"`
	Address   string    `json:"address"`
	Area      float64   `json:"area"`  // площадь
	Rooms     int       `json:"rooms"` // количество комнат
	Price     float64   `json:"price"` // цена
	CreatedAt time.Time `json:"created_at"`
}

// Запрос на регистрацию/логин
type AuthRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Ответ с токеном
type AuthResponse struct {
	Token string `json:"token"`
}

// Запрос на создание объекта
type CreatePropertyRequest struct {
	Address string  `json:"address"`
	Area    float64 `json:"area"`
	Rooms   int     `json:"rooms"`
	Price   float64 `json:"price"`
}

// Запрос на предсказание
type PredictRequest struct {
	Area  float64 `json:"area"`
	Rooms int     `json:"rooms"`
}

type PredictResponse struct {
	PredictedPrice float64 `json:"predicted_price"`
}

// Избранное (связь пользователя и объекта)
type Favorite struct {
	UserID     int       `json:"user_id"`
	PropertyID int       `json:"property_id"`
	CreatedAt  time.Time `json:"created_at"`
}

// Запрос на добавление в избранное (если нужно, но обычно просто ID в URL)
type FavoriteRequest struct {
	PropertyID int `json:"property_id"`
}
