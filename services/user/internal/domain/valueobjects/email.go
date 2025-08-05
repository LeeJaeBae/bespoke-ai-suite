package valueobjects

import (
	"errors"
	"regexp"
	"strings"
)

// Email represents an email address value object
type Email struct {
	value string
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// NewEmail creates a new Email value object with validation
func NewEmail(email string) (Email, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	
	if email == "" {
		return Email{}, errors.New("email cannot be empty")
	}
	
	if !emailRegex.MatchString(email) {
		return Email{}, errors.New("invalid email format")
	}
	
	return Email{value: email}, nil
}

// String returns the string representation of the email
func (e Email) String() string {
	return e.value
}

// Equals checks if two email addresses are equal
func (e Email) Equals(other Email) bool {
	return e.value == other.value
}

// Domain returns the domain part of the email
func (e Email) Domain() string {
	parts := strings.Split(e.value, "@")
	if len(parts) == 2 {
		return parts[1]
	}
	return ""
}

// LocalPart returns the local part of the email (before @)
func (e Email) LocalPart() string {
	parts := strings.Split(e.value, "@")
	if len(parts) == 2 {
		return parts[0]
	}
	return ""
}