from dataclasses import dataclass
from decimal import Decimal
from enum import Enum
from typing import Self


class Currency(Enum):
    """Supported currencies"""
    
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    KRW = "KRW"
    CNY = "CNY"


@dataclass(frozen=True)
class Budget:
    """Campaign budget value object"""
    
    amount: Decimal
    currency: Currency
    daily_limit: Decimal | None = None
    
    def __post_init__(self) -> None:
        if self.amount < 0:
            raise ValueError("Budget amount cannot be negative")
        
        if self.daily_limit is not None and self.daily_limit < 0:
            raise ValueError("Daily limit cannot be negative")
        
        if self.daily_limit is not None and self.daily_limit > self.amount:
            raise ValueError("Daily limit cannot exceed total budget")
    
    @classmethod
    def create(
        cls,
        amount: float | Decimal,
        currency: str | Currency,
        daily_limit: float | Decimal | None = None
    ) -> Self:
        """Factory method to create Budget"""
        if isinstance(amount, float):
            amount = Decimal(str(amount))
        
        if isinstance(currency, str):
            currency = Currency(currency)
        
        if daily_limit is not None and isinstance(daily_limit, float):
            daily_limit = Decimal(str(daily_limit))
        
        return cls(amount=amount, currency=currency, daily_limit=daily_limit)
    
    def subtract(self, amount: Decimal) -> Self:
        """Subtract amount from budget"""
        if amount > self.amount:
            raise ValueError("Cannot subtract more than available budget")
        
        new_amount = self.amount - amount
        return Budget(
            amount=new_amount,
            currency=self.currency,
            daily_limit=self.daily_limit
        )
    
    def add(self, amount: Decimal) -> Self:
        """Add amount to budget"""
        new_amount = self.amount + amount
        return Budget(
            amount=new_amount,
            currency=self.currency,
            daily_limit=self.daily_limit
        )
    
    def has_sufficient_funds(self, amount: Decimal) -> bool:
        """Check if budget has sufficient funds"""
        return self.amount >= amount
    
    def get_remaining_daily_budget(self, spent_today: Decimal) -> Decimal:
        """Get remaining daily budget"""
        if self.daily_limit is None:
            return self.amount
        
        return min(self.daily_limit - spent_today, self.amount)
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "amount": str(self.amount),
            "currency": self.currency.value,
            "daily_limit": str(self.daily_limit) if self.daily_limit else None
        }
    
    def __str__(self) -> str:
        base = f"{self.amount} {self.currency.value}"
        if self.daily_limit:
            base += f" (Daily: {self.daily_limit})"
        return base