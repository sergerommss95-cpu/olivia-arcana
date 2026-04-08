"""Database models — User + saved charts."""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship, DeclarativeBase
from datetime import datetime


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Birth data
    birth_year = Column(Integer, nullable=True)
    birth_month = Column(Integer, nullable=True)
    birth_day = Column(Integer, nullable=True)
    birth_hour = Column(Integer, nullable=True)
    birth_minute = Column(Integer, nullable=True)
    birth_city = Column(String(100), nullable=True)
    birth_lat = Column(Float, nullable=True)
    birth_lon = Column(Float, nullable=True)
    birth_tz = Column(Float, nullable=True)

    # Computed chart summary
    sun_sign = Column(String(20), nullable=True)
    moon_sign = Column(String(20), nullable=True)
    rising_sign = Column(String(20), nullable=True)

    charts = relationship("SavedChart", back_populates="user")


class SavedChart(Base):
    __tablename__ = "saved_charts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chart_json = Column(Text, nullable=False)  # full natal chart as JSON
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="charts")
