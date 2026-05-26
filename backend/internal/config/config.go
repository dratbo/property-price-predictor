package config

import "os"

type Config struct {
	DatabaseURL  string
	JWTSecret    string
	MLServiceURL string
	Port         string
}

func Load() Config {
	return Config{
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://property:property@localhost:5432/property_db?sslmode=disable"),
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		MLServiceURL: getEnv("ML_SERVICE_URL", "http://localhost:8000"),
		Port:         getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
