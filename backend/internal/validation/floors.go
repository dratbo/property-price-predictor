package validation

import (
	"errors"
	"fmt"
)

const (
	MinFloor       = 1
	MaxFloor       = 100
	MinTotalFloors = 1
	MaxTotalFloors = 75
)

func ValidateFloors(floor, totalFloors *int) error {
	if floor != nil {
		if *floor < MinFloor || *floor > MaxFloor {
			return fmt.Errorf("floor must be between %d and %d", MinFloor, MaxFloor)
		}
	}
	if totalFloors != nil {
		if *totalFloors < MinTotalFloors || *totalFloors > MaxTotalFloors {
			return fmt.Errorf("total_floors must be between %d and %d", MinTotalFloors, MaxTotalFloors)
		}
	}
	if floor != nil && totalFloors != nil && *floor > *totalFloors {
		return errors.New("floor cannot be greater than total_floors")
	}
	return nil
}
