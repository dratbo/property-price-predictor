package repository

import (
	"context"
	"fmt"
	"strings"

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
	building_type, year_built, developer, repair_type, building_repair_type, price, source_url, created_at, updated_at`

func scanProperty(row interface {
	Scan(dest ...any) error
}) (*models.Property, error) {
	var p models.Property
	err := row.Scan(
		&p.ID, &p.Address, &p.City, &p.District, &p.Metro, &p.Area, &p.Rooms,
		&p.Floor, &p.TotalFloors, &p.BuildingType, &p.YearBuilt, &p.Developer,
		&p.RepairType, &p.BuildingRepairType, &p.Price, &p.SourceURL, &p.CreatedAt, &p.UpdatedAt,
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
			building_type, year_built, developer, repair_type, building_repair_type, price, source_url
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		RETURNING id, created_at, updated_at`,
		property.Address, property.City, property.District, property.Metro,
		property.Area, property.Rooms, property.Floor, property.TotalFloors,
		property.BuildingType, property.YearBuilt, property.Developer,
		property.RepairType, property.BuildingRepairType, property.Price, property.SourceURL,
	).Scan(&property.ID, &property.CreatedAt, &property.UpdatedAt)
	return err
}

func buildListWhere(filters models.PropertyListFilters) (string, []any) {
	clauses := []string{"1=1"}
	args := []any{}
	n := 1

	addEq := func(column, value string) {
		if value == "" {
			return
		}
		clauses = append(clauses, fmt.Sprintf("%s = $%d", column, n))
		args = append(args, value)
		n++
	}
	addEqInt := func(column string, value *int) {
		if value == nil {
			return
		}
		clauses = append(clauses, fmt.Sprintf("%s = $%d", column, n))
		args = append(args, *value)
		n++
	}

	addEq("city", filters.City)
	addEq("district", filters.District)
	addEq("building_type", filters.BuildingType)
	addEq("developer", filters.Developer)
	addEq("repair_type", filters.RepairType)
	addEq("building_repair_type", filters.BuildingRepairType)
	addEqInt("rooms", filters.Rooms)
	addEqInt("floor", filters.Floor)
	addEqInt("total_floors", filters.TotalFloors)
	addEqInt("year_built", filters.YearBuilt)
	if filters.Area != nil {
		clauses = append(clauses, fmt.Sprintf("ROUND(area::numeric) = $%d", n))
		args = append(args, int(*filters.Area+0.5))
		n++
	}

	return strings.Join(clauses, " AND "), args
}

func (r *PgPropertyRepo) GetPage(page, limit int, filters models.PropertyListFilters) ([]*models.Property, int, error) {
	ctx := context.Background()
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	where, args := buildListWhere(filters)

	var total int
	countSQL := `SELECT COUNT(*) FROM properties WHERE ` + where
	if err := r.pool.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	listArgs := append([]any{}, args...)
	listArgs = append(listArgs, limit, offset)
	limitPos := len(args) + 1
	offsetPos := len(args) + 2
	query := `SELECT ` + propertyColumns + ` FROM properties WHERE ` + where +
		fmt.Sprintf(` ORDER BY id DESC LIMIT $%d OFFSET $%d`, limitPos, offsetPos)

	rows, err := r.pool.Query(ctx, query, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var result []*models.Property
	for rows.Next() {
		p, err := scanProperty(rows)
		if err != nil {
			return nil, 0, err
		}
		result = append(result, p)
	}
	return result, total, rows.Err()
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

func (r *PgPropertyRepo) distinctByCity(ctx context.Context, city, column string) ([]string, error) {
	query := `SELECT DISTINCT ` + column + ` FROM properties
		WHERE city = $1 AND ` + column + ` IS NOT NULL AND TRIM(` + column + `) <> ''
		ORDER BY ` + column
	rows, err := r.pool.Query(ctx, query, city)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []string
	for rows.Next() {
		var value string
		if err := rows.Scan(&value); err != nil {
			return nil, err
		}
		result = append(result, value)
	}
	return result, rows.Err()
}

func (r *PgPropertyRepo) GetCityFilters(city string) (*models.CityFilters, error) {
	ctx := context.Background()
	developers, err := r.distinctByCity(ctx, city, "developer")
	if err != nil {
		return nil, err
	}
	districts, err := r.distinctByCity(ctx, city, "district")
	if err != nil {
		return nil, err
	}
	buildingTypes, err := r.distinctByCity(ctx, city, "building_type")
	if err != nil {
		return nil, err
	}
	repairTypes, err := r.distinctByCity(ctx, city, "repair_type")
	if err != nil {
		return nil, err
	}
	buildingRepairTypes, err := r.distinctByCity(ctx, city, "building_repair_type")
	if err != nil {
		return nil, err
	}
	return &models.CityFilters{
		Developers:          developers,
		Districts:           districts,
		BuildingTypes:       buildingTypes,
		RepairTypes:         repairTypes,
		BuildingRepairTypes: buildingRepairTypes,
	}, nil
}

func (r *PgPropertyRepo) Count() (int, error) {
	ctx := context.Background()
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM properties`).Scan(&count)
	return count, err
}
