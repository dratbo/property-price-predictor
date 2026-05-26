package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dratbo/property-price-predictor/backend/internal/models"
)

type PgPropertyRepo struct {
	pool *pgxpool.Pool
}

func NewPgPropertyRepo(pool *pgxpool.Pool) *PgPropertyRepo {
	return &PgPropertyRepo{pool: pool}
}

const propertyColumns = `id, address, city, district, metro, area, rooms, floor, total_floors,
	building_type, year_built, developer, repair_type, price, source_url, created_at, updated_at`

func scanProperty(row interface {
	Scan(dest ...any) error
}) (*models.Property, error) {
	var p models.Property
	err := row.Scan(
		&p.ID, &p.Address, &p.City, &p.District, &p.Metro, &p.Area, &p.Rooms,
		&p.Floor, &p.TotalFloors, &p.BuildingType, &p.YearBuilt, &p.Developer,
		&p.RepairType, &p.Price, &p.SourceURL, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PgPropertyRepo) Create(property *models.Property) error {
	ctx := context.Background()
	err := r.pool.QueryRow(ctx, `
		INSERT INTO properties (
			address, city, district, metro, area, rooms, floor, total_floors,
			building_type, year_built, developer, repair_type, price, source_url
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		RETURNING id, created_at, updated_at`,
		property.Address, property.City, property.District, property.Metro,
		property.Area, property.Rooms, property.Floor, property.TotalFloors,
		property.BuildingType, property.YearBuilt, property.Developer,
		property.RepairType, property.Price, property.SourceURL,
	).Scan(&property.ID, &property.CreatedAt, &property.UpdatedAt)
	return err
}

func (r *PgPropertyRepo) GetAll() ([]*models.Property, error) {
	ctx := context.Background()
	rows, err := r.pool.Query(ctx, `SELECT `+propertyColumns+` FROM properties ORDER BY id DESC`)
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

func (r *PgPropertyRepo) GetByID(id int) (*models.Property, error) {
	ctx := context.Background()
	row := r.pool.QueryRow(ctx, `SELECT `+propertyColumns+` FROM properties WHERE id = $1`, id)
	p, err := scanProperty(row)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *PgPropertyRepo) Count() (int, error) {
	ctx := context.Background()
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM properties`).Scan(&count)
	return count, err
}
