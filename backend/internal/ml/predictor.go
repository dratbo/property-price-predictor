package ml

import (
	"github.com/dratbo/property-price-predictor/backend/internal/models"
	"gonum.org/v1/gonum/mat"
)

type Predictor struct {
	properties []*models.Property
}

func NewPredictor(props []*models.Property) *Predictor {
	return &Predictor{properties: props}
}

// Predict возвращает предсказанную цену для заданных area и rooms
func (p *Predictor) Predict(area float64, rooms int) (float64, error) {
	n := len(p.properties)
	if n == 0 {
		// если нет данных, возвращаем заглушку или ошибку
		return 0, nil // можно вернуть 0 или ошибку
	}

	// Собираем данные: X = [1, area, rooms], y = price
	X := mat.NewDense(n, 3, nil)
	y := mat.NewVecDense(n, nil)
	for i, prop := range p.properties {
		X.Set(i, 0, 1)
		X.Set(i, 1, prop.Area)
		X.Set(i, 2, float64(prop.Rooms))
		y.SetVec(i, prop.Price)
	}

	// Решаем нормальное уравнение: beta = (X^T X)^{-1} X^T y
	var beta mat.VecDense
	err := beta.SolveVec(X, y)
	if err != nil {
		return 0, err
	}

	// Предсказание: beta0 + beta1*area + beta2*rooms
	predicted := beta.At(0, 0) + beta.At(1, 0)*area + beta.At(2, 0)*float64(rooms)
	return predicted, nil
}
