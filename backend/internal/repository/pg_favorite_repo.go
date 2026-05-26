package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dratbo/property-price-predictor/backend/internal/models"
)

type PgFavoriteRepo struct {
	pool *pgxpool.Pool
}

func NewPgFavoriteRepo(pool *pgxpool.Pool) *PgFavoriteRepo {
	return &PgFavoriteRepo{pool: pool}
}

func (r *PgFavoriteRepo) Add(userID, propertyID int) error {
	ctx := context.Background()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO favorites (user_id, property_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, propertyID,
	)
	return err
}

func (r *PgFavoriteRepo) Remove(userID, propertyID int) error {
	ctx := context.Background()
	_, err := r.pool.Exec(ctx,
		`DELETE FROM favorites WHERE user_id = $1 AND property_id = $2`,
		userID, propertyID,
	)
	return err
}

func (r *PgFavoriteRepo) GetPropertiesByUser(userID int) ([]*models.Property, error) {
	ctx := context.Background()
	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.address, p.city, p.district, p.metro, p.area, p.rooms, p.floor,
			p.total_floors, p.building_type, p.year_built, p.developer, p.repair_type,
			p.price, p.source_url, p.created_at, p.updated_at
		FROM properties p
		INNER JOIN favorites f ON f.property_id = p.id
		WHERE f.user_id = $1
		ORDER BY f.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*models.Property
	for rows.Next() {
		p, err := scanProperty(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}
