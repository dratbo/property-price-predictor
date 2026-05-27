package models

import "time"

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type Property struct {
	ID           int       `json:"id"`
	Address      string    `json:"address"`
	City         string    `json:"city"`
	District     *string   `json:"district,omitempty"`
	Metro        *string   `json:"metro,omitempty"`
	Area         float64   `json:"area"`
	Rooms        int       `json:"rooms"`
	Floor        *int      `json:"floor,omitempty"`
	TotalFloors  *int      `json:"total_floors,omitempty"`
	BuildingType *string   `json:"building_type,omitempty"`
	YearBuilt    *int      `json:"year_built,omitempty"`
	Developer    *string   `json:"developer,omitempty"`
	HousingType         *string `json:"housing_type,omitempty"`
	ApartmentType       *string `json:"apartment_type,omitempty"`
	RepairType          *string `json:"repair_type,omitempty"`
	BuildingRepairType  *string `json:"building_repair_type,omitempty"`
	Price               float64 `json:"price"`
	SourceURL    *string   `json:"source_url,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type AuthRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
}

type PropertyListResponse struct {
	Items      []*Property `json:"items"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

type CreatePropertyRequest struct {
	Address      string  `json:"address"`
	City         string  `json:"city"`
	District     *string `json:"district,omitempty"`
	Metro        *string `json:"metro,omitempty"`
	Area         float64 `json:"area"`
	Rooms        int     `json:"rooms"`
	Floor        *int    `json:"floor,omitempty"`
	TotalFloors  *int    `json:"total_floors,omitempty"`
	BuildingType *string `json:"building_type,omitempty"`
	YearBuilt    *int    `json:"year_built,omitempty"`
	Developer    *string `json:"developer,omitempty"`
	HousingType        *string `json:"housing_type,omitempty"`
	ApartmentType      *string `json:"apartment_type,omitempty"`
	RepairType         *string `json:"repair_type,omitempty"`
	BuildingRepairType *string `json:"building_repair_type,omitempty"`
	Price              float64 `json:"price"`
	SourceURL          *string `json:"source_url,omitempty"`
}

type PredictRequest struct {
	Area         float64 `json:"area"`
	Rooms        int     `json:"rooms"`
	City         string  `json:"city"`
	District     *string `json:"district,omitempty"`
	Metro        *string `json:"metro,omitempty"`
	Floor        *int    `json:"floor,omitempty"`
	TotalFloors  *int    `json:"total_floors,omitempty"`
	BuildingType *string `json:"building_type,omitempty"`
	YearBuilt    *int    `json:"year_built,omitempty"`
	Developer    *string `json:"developer,omitempty"`
	HousingType        *string `json:"housing_type,omitempty"`
	ApartmentType      *string `json:"apartment_type,omitempty"`
	RepairType         *string `json:"repair_type,omitempty"`
	BuildingRepairType *string `json:"building_repair_type,omitempty"`
}

type PredictResponse struct {
	PredictedPrice float64 `json:"predicted_price"`
}

type Favorite struct {
	UserID     int       `json:"user_id"`
	PropertyID int       `json:"property_id"`
	CreatedAt  time.Time `json:"created_at"`
}
