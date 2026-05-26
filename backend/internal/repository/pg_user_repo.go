package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dratbo/property-price-predictor/backend/internal/models"
)

type PgUserRepo struct {
	pool *pgxpool.Pool
}

func NewPgUserRepo(pool *pgxpool.Pool) *PgUserRepo {
	return &PgUserRepo{pool: pool}
}

func (r *PgUserRepo) Create(user *models.User) error {
	ctx := context.Background()
	return r.pool.QueryRow(ctx,
		`INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, created_at`,
		user.Email, user.PasswordHash,
	).Scan(&user.ID, &user.CreatedAt)
}

func (r *PgUserRepo) FindByEmail(email string) (*models.User, error) {
	ctx := context.Background()
	var user models.User
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, created_at FROM users WHERE email = $1`, email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *PgUserRepo) FindByID(id int) (*models.User, error) {
	ctx := context.Background()
	var user models.User
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, created_at FROM users WHERE id = $1`, id,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}
