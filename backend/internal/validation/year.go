package validation

import "fmt"

const (
	MinYearBuilt = 1901
	MaxYearBuilt = 2026
)

func ValidateYearBuilt(year *int) error {
	if year == nil {
		return nil
	}
	if *year < MinYearBuilt || *year > MaxYearBuilt {
		return fmt.Errorf("year_built must be between %d and %d", MinYearBuilt, MaxYearBuilt)
	}
	return nil
}
