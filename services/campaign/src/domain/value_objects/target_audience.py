from dataclasses import dataclass, field
from enum import Enum
from typing import Self


class Gender(Enum):
    """Target gender options"""
    
    ALL = "ALL"
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


@dataclass(frozen=True)
class AgeRange:
    """Age range for targeting"""
    
    min_age: int
    max_age: int
    
    def __post_init__(self) -> None:
        if self.min_age < 0:
            raise ValueError("Minimum age cannot be negative")
        
        if self.max_age < self.min_age:
            raise ValueError("Maximum age must be greater than or equal to minimum age")
        
        if self.max_age > 120:
            raise ValueError("Maximum age seems unrealistic")
    
    def contains(self, age: int) -> bool:
        """Check if age is within range"""
        return self.min_age <= age <= self.max_age
    
    def __str__(self) -> str:
        return f"{self.min_age}-{self.max_age}"


@dataclass(frozen=True)
class TargetAudience:
    """Target audience criteria"""
    
    age_range: AgeRange | None = None
    gender: Gender = Gender.ALL
    locations: list[str] = field(default_factory=list)
    interests: list[str] = field(default_factory=list)
    languages: list[str] = field(default_factory=list)
    devices: list[str] = field(default_factory=list)  # mobile, desktop, tablet
    custom_segments: list[str] = field(default_factory=list)
    
    @classmethod
    def create(
        cls,
        age_range: tuple[int, int] | None = None,
        gender: str | Gender = Gender.ALL,
        locations: list[str] | None = None,
        interests: list[str] | None = None,
        languages: list[str] | None = None,
        devices: list[str] | None = None,
        custom_segments: list[str] | None = None
    ) -> Self:
        """Factory method to create TargetAudience"""
        if age_range:
            age_range_obj = AgeRange(min_age=age_range[0], max_age=age_range[1])
        else:
            age_range_obj = None
        
        if isinstance(gender, str):
            gender = Gender(gender)
        
        return cls(
            age_range=age_range_obj,
            gender=gender,
            locations=locations or [],
            interests=interests or [],
            languages=languages or [],
            devices=devices or [],
            custom_segments=custom_segments or []
        )
    
    def is_broad_targeting(self) -> bool:
        """Check if targeting is too broad"""
        has_criteria = (
            self.age_range is not None or
            self.gender != Gender.ALL or
            len(self.locations) > 0 or
            len(self.interests) > 0 or
            len(self.languages) > 0 or
            len(self.devices) > 0 or
            len(self.custom_segments) > 0
        )
        return not has_criteria
    
    def estimate_audience_size(self) -> str:
        """Estimate audience size based on criteria"""
        # 실제로는 외부 서비스나 데이터베이스를 통해 계산
        if self.is_broad_targeting():
            return "Very Large (1M+)"
        
        criteria_count = sum([
            1 if self.age_range else 0,
            1 if self.gender != Gender.ALL else 0,
            1 if self.locations else 0,
            1 if self.interests else 0,
            1 if self.languages else 0,
            1 if self.devices else 0,
            1 if self.custom_segments else 0
        ])
        
        if criteria_count >= 4:
            return "Small (< 10K)"
        elif criteria_count >= 2:
            return "Medium (10K - 100K)"
        else:
            return "Large (100K - 1M)"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "age_range": {
                "min": self.age_range.min_age,
                "max": self.age_range.max_age
            } if self.age_range else None,
            "gender": self.gender.value,
            "locations": self.locations,
            "interests": self.interests,
            "languages": self.languages,
            "devices": self.devices,
            "custom_segments": self.custom_segments
        }