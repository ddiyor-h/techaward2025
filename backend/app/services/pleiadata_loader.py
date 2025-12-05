"""
PLEIAData dataset loader.

Loads and parses CSV data from the PLEIAData dataset (University of Murcia).
Dataset: https://zenodo.org/records/7620136

Actual file structure (processed_data/):
- consA-60T.csv, consB-60T.csv, consC-60T.csv - Energy consumption (hourly)
- hvac-aggA-60T.csv, hvac-aggB-60T.csv, hvac-aggC-60T.csv - HVAC aggregated
- temp-sensorA-60T.csv, temp-sensorB-60T.csv, temp-sensorC-60T.csv - Temperature
- data-weather-60T.csv - Weather data
- data-roomX-10T.csv - Detailed room data

Raw files (raw_data/):
- data-CO2.csv - CO2 readings
- data-hvac.csv - Detailed HVAC data
- data-presence.csv - Presence sensors
"""
import pandas as pd
from pathlib import Path
from datetime import datetime
from typing import Optional
from functools import lru_cache


class PLEIADataLoader:
    """Loader for PLEIAData dataset."""

    # Dataset period: January 1, 2021 - December 18, 2021
    DATASET_START = datetime(2021, 1, 1)
    DATASET_END = datetime(2021, 12, 18)

    # Building info (Pleiades, University of Murcia)
    BUILDING_INFO = {
        "pleiades-a": {
            "name": "Pleiades Block A",
            "area_sqm": 4500.0,
            "floors": 5,
            "city": "Murcia",
            "country": "Spain",
            "latitude": 37.9922,
            "longitude": -1.1307,
            "year_built": 2010,
            "building_type": "University Office",
        },
        "pleiades-b": {
            "name": "Pleiades Block B",
            "area_sqm": 2500.0,
            "floors": 2,
            "city": "Murcia",
            "country": "Spain",
            "latitude": 37.9922,
            "longitude": -1.1307,
            "year_built": 2010,
            "building_type": "University Office",
        },
        "pleiades-c": {
            "name": "Pleiades Block C",
            "area_sqm": 1200.0,
            "floors": 1,
            "city": "Murcia",
            "country": "Spain",
            "latitude": 37.9922,
            "longitude": -1.1307,
            "year_built": 2010,
            "building_type": "University Office",
        },
    }

    def __init__(self, data_path: Path):
        """Initialize loader with path to dataset."""
        self.data_path = Path(data_path)
        self._consumption_cache: dict[str, pd.DataFrame] = {}
        self._hvac_cache: dict[str, pd.DataFrame] = {}
        self._temperature_cache: dict[str, pd.DataFrame] = {}
        self._weather_cache: Optional[pd.DataFrame] = None
        self._co2_cache: Optional[pd.DataFrame] = None

    def _get_processed_path(self) -> Path:
        """Get path to processed_data folder."""
        # Handle nested Data_Nature structure
        nested = self.data_path / "Data_Nature" / "processed_data"
        if nested.exists():
            return nested
        direct = self.data_path / "processed_data"
        if direct.exists():
            return direct
        return self.data_path

    def _get_raw_path(self) -> Path:
        """Get path to raw_data folder."""
        nested = self.data_path / "Data_Nature" / "raw_data"
        if nested.exists():
            return nested
        direct = self.data_path / "raw_data"
        if direct.exists():
            return direct
        return self.data_path

    def _map_date_to_dataset(self, dt: datetime) -> datetime:
        """Map any date to equivalent date in 2021 dataset period."""
        try:
            return dt.replace(year=2021)
        except ValueError:
            # Handle Feb 29 in leap years
            return dt.replace(year=2021, day=28)

    def load_consumption(self, block: str = "a") -> Optional[pd.DataFrame]:
        """
        Load energy consumption data for a block.

        Files: consA-60T.csv, consB-60T.csv, consC-60T.csv
        Columns: Date;dif_cons_real;cons_total;dif_cons_smooth

        Returns:
            DataFrame with columns: timestamp, consumption_kwh
        """
        block = block.lower()
        if block in self._consumption_cache:
            return self._consumption_cache[block]

        processed = self._get_processed_path()
        file_path = processed / f"cons{block.upper()}-60T.csv"

        if not file_path.exists():
            print(f"Consumption file not found: {file_path}")
            return None

        try:
            df = pd.read_csv(file_path, sep=";")
            df["timestamp"] = pd.to_datetime(df["Date"])
            # Use dif_cons_real (differential consumption) as hourly kWh
            df["consumption_kwh"] = pd.to_numeric(df["dif_cons_real"], errors="coerce")
            df = df[["timestamp", "consumption_kwh"]].dropna()
            df = df.sort_values("timestamp")

            self._consumption_cache[block] = df
            return df

        except Exception as e:
            print(f"Error loading consumption data for block {block}: {e}")
            return None

    def load_hvac(self, block: str = "a") -> Optional[pd.DataFrame]:
        """
        Load HVAC aggregated data for a block.

        Files: hvac-aggA-60T.csv, hvac-aggB-60T.csv, hvac-aggC-60T.csv
        Columns: Date;V4;V12;V26;V5_0;V5_1;V5_2;...

        V4 = state (0=off, 1=on)
        V12 = setpoint temperature
        V26 = mode (0=off, 1=heat, 2=cool, 3=auto)
        V5_0, V5_1, V5_2 = mode one-hot encoding

        Returns:
            DataFrame with HVAC status
        """
        block = block.lower()
        if block in self._hvac_cache:
            return self._hvac_cache[block]

        processed = self._get_processed_path()
        file_path = processed / f"hvac-agg{block.upper()}-60T.csv"

        if not file_path.exists():
            print(f"HVAC file not found: {file_path}")
            return None

        try:
            df = pd.read_csv(file_path, sep=";")
            df["timestamp"] = pd.to_datetime(df["Date"])
            # Rename columns to meaningful names
            df["state"] = df["V4"].apply(lambda x: "running" if x > 0 else "off")
            df["setpoint"] = pd.to_numeric(df["V12"], errors="coerce")
            df["mode_code"] = pd.to_numeric(df["V26"], errors="coerce")
            df["mode"] = df["mode_code"].map({
                0: "off",
                1: "heating",
                2: "cooling",
                3: "auto"
            }).fillna("auto")

            self._hvac_cache[block] = df
            return df

        except Exception as e:
            print(f"Error loading HVAC data for block {block}: {e}")
            return None

    def load_temperature(self, block: str = "a") -> Optional[pd.DataFrame]:
        """
        Load indoor temperature data for a block.

        Files: temp-sensorA-60T.csv, temp-sensorB-60T.csv, temp-sensorC-60T.csv
        Columns: Date;V2

        V2 = average indoor temperature

        Returns:
            DataFrame with temperature readings
        """
        block = block.lower()
        if block in self._temperature_cache:
            return self._temperature_cache[block]

        processed = self._get_processed_path()
        file_path = processed / f"temp-sensor{block.upper()}-60T.csv"

        if not file_path.exists():
            print(f"Temperature file not found: {file_path}")
            return None

        try:
            df = pd.read_csv(file_path, sep=";")
            df["timestamp"] = pd.to_datetime(df["Date"])
            df["temperature"] = pd.to_numeric(df["V2"], errors="coerce")
            df = df[["timestamp", "temperature"]].dropna()

            self._temperature_cache[block] = df
            return df

        except Exception as e:
            print(f"Error loading temperature data for block {block}: {e}")
            return None

    def load_weather(self) -> Optional[pd.DataFrame]:
        """
        Load outdoor weather data.

        File: data-weather-60T.csv
        Columns: Date;tmed;hrmed;radmed;vvmed;dvmed;prec;dewpt;dpv

        tmed = temperature (°C)
        hrmed = relative humidity (%)
        radmed = solar radiation
        vvmed = wind speed
        dvmed = wind direction
        prec = precipitation
        dewpt = dew point
        dpv = vapor pressure deficit

        Returns:
            DataFrame with weather readings
        """
        if self._weather_cache is not None:
            return self._weather_cache

        processed = self._get_processed_path()
        file_path = processed / "data-weather-60T.csv"

        if not file_path.exists():
            print(f"Weather file not found: {file_path}")
            return None

        try:
            df = pd.read_csv(file_path, sep=";")
            df["timestamp"] = pd.to_datetime(df["Date"])
            df["outdoor_temp"] = pd.to_numeric(df["tmed"], errors="coerce")
            df["humidity"] = pd.to_numeric(df["hrmed"], errors="coerce")
            df["wind_speed"] = pd.to_numeric(df["vvmed"], errors="coerce")
            df["precipitation"] = pd.to_numeric(df["prec"], errors="coerce")

            self._weather_cache = df
            return df

        except Exception as e:
            print(f"Error loading weather data: {e}")
            return None

    def load_co2(self) -> Optional[pd.DataFrame]:
        """
        Load CO2 data from raw files.

        File: raw_data/data-CO2.csv
        Columns: IDdevice;Date;V17

        V17 = CO2 concentration (ppm)

        Returns:
            DataFrame with CO2 readings
        """
        if self._co2_cache is not None:
            return self._co2_cache

        raw = self._get_raw_path()
        file_path = raw / "data-CO2.csv"

        if not file_path.exists():
            print(f"CO2 file not found: {file_path}")
            return None

        try:
            # This file is large (561MB), read in chunks or sample
            df = pd.read_csv(file_path, sep=";", nrows=100000)  # Sample first 100k rows
            df["timestamp"] = pd.to_datetime(df["Date"])
            df["co2_ppm"] = pd.to_numeric(df["V17"], errors="coerce")
            df["device_id"] = df["IDdevice"]

            self._co2_cache = df
            return df

        except Exception as e:
            print(f"Error loading CO2 data: {e}")
            return None

    def get_energy_for_period(
        self,
        block: str,
        start: datetime,
        end: datetime,
        resolution: str = "hourly",
    ) -> list[dict]:
        """
        Get energy data for a specific period.

        Args:
            block: "a", "b", or "c"
            start: Start datetime (will be mapped to 2021)
            end: End datetime (will be mapped to 2021)
            resolution: "hourly", "daily", or "monthly"

        Returns:
            List of dicts with timestamp and value
        """
        df = self.load_consumption(block)
        if df is None or df.empty:
            return []

        # Map dates to 2021
        start_2021 = self._map_date_to_dataset(start)
        end_2021 = self._map_date_to_dataset(end)

        # Handle year boundary
        if start_2021 > end_2021:
            end_2021 = end_2021.replace(year=2022)

        # Normalize timestamps to naive (remove timezone)
        df_work = df.copy()
        if df_work["timestamp"].dt.tz is not None:
            df_work["timestamp"] = df_work["timestamp"].dt.tz_localize(None)

        # Ensure comparison dates are naive
        if hasattr(start_2021, 'tzinfo') and start_2021.tzinfo is not None:
            start_2021 = start_2021.replace(tzinfo=None)
        if hasattr(end_2021, 'tzinfo') and end_2021.tzinfo is not None:
            end_2021 = end_2021.replace(tzinfo=None)

        # Filter by date range
        mask = (df_work["timestamp"] >= start_2021) & (df_work["timestamp"] <= end_2021)
        filtered = df_work[mask].copy()

        if filtered.empty:
            return []

        # Resample based on resolution
        filtered = filtered.set_index("timestamp")

        if resolution == "hourly":
            resampled = filtered.resample("h").sum()
        elif resolution == "daily":
            resampled = filtered.resample("D").sum()
        elif resolution == "monthly":
            resampled = filtered.resample("ME").sum()
        else:
            resampled = filtered

        # Convert back to original year
        year_diff = start.year - 2021
        result = []
        for ts, row in resampled.iterrows():
            if pd.notna(row["consumption_kwh"]) and row["consumption_kwh"] > 0:
                try:
                    adjusted_ts = ts.replace(year=ts.year + year_diff)
                except ValueError:
                    adjusted_ts = ts.replace(year=ts.year + year_diff, day=28)

                result.append({
                    "timestamp": adjusted_ts,
                    "value": round(row["consumption_kwh"], 2),
                })

        return result

    def get_hvac_status_for_time(
        self,
        block: str,
        at_time: datetime,
    ) -> dict:
        """
        Get HVAC status for a specific time.

        Returns:
            Dict with state, mode, setpoint
        """
        df = self.load_hvac(block)
        if df is None or df.empty:
            return {}

        time_2021 = self._map_date_to_dataset(at_time)

        # Find closest time in data
        df_copy = df.copy()
        df_copy["timestamp_naive"] = df_copy["timestamp"].dt.tz_localize(None)
        time_naive = time_2021.replace(tzinfo=None) if hasattr(time_2021, 'tzinfo') else time_2021

        df_copy["time_diff"] = abs(df_copy["timestamp_naive"] - pd.Timestamp(time_naive))
        closest = df_copy.nsmallest(1, "time_diff")

        if closest.empty:
            return {}

        row = closest.iloc[0]
        return {
            "state": row.get("state", "off"),
            "mode": row.get("mode", "auto"),
            "setpoint": float(row.get("setpoint", 22)) if pd.notna(row.get("setpoint")) else 22.0,
        }

    def get_temperature_for_time(
        self,
        block: str,
        at_time: datetime,
    ) -> float:
        """
        Get indoor temperature for a specific time.

        Returns:
            Temperature in °C
        """
        df = self.load_temperature(block)
        if df is None or df.empty:
            return 22.0

        time_2021 = self._map_date_to_dataset(at_time)

        # Find closest time in data
        df_copy = df.copy()
        df_copy["timestamp_naive"] = df_copy["timestamp"].dt.tz_localize(None)
        time_naive = time_2021.replace(tzinfo=None) if hasattr(time_2021, 'tzinfo') else time_2021

        df_copy["time_diff"] = abs(df_copy["timestamp_naive"] - pd.Timestamp(time_naive))
        closest = df_copy.nsmallest(1, "time_diff")

        if closest.empty:
            return 22.0

        temp = closest.iloc[0].get("temperature", 22.0)
        return float(temp) if pd.notna(temp) else 22.0

    def get_weather_for_time(self, at_time: datetime) -> dict:
        """
        Get weather data for a specific time.

        Returns:
            Dict with outdoor_temp, humidity, etc.
        """
        df = self.load_weather()
        if df is None or df.empty:
            return {"outdoor_temp": 20.0, "humidity": 50.0}

        time_2021 = self._map_date_to_dataset(at_time)

        df_copy = df.copy()
        df_copy["timestamp_naive"] = df_copy["timestamp"].dt.tz_localize(None)
        time_naive = time_2021.replace(tzinfo=None) if hasattr(time_2021, 'tzinfo') else time_2021

        df_copy["time_diff"] = abs(df_copy["timestamp_naive"] - pd.Timestamp(time_naive))
        closest = df_copy.nsmallest(1, "time_diff")

        if closest.empty:
            return {"outdoor_temp": 20.0, "humidity": 50.0}

        row = closest.iloc[0]
        return {
            "outdoor_temp": float(row.get("outdoor_temp", 20)) if pd.notna(row.get("outdoor_temp")) else 20.0,
            "humidity": float(row.get("humidity", 50)) if pd.notna(row.get("humidity")) else 50.0,
            "wind_speed": float(row.get("wind_speed", 0)) if pd.notna(row.get("wind_speed")) else 0.0,
        }

    def get_co2_for_time(self, at_time: datetime) -> float:
        """
        Get average CO2 level for a specific time.

        Returns:
            CO2 in ppm
        """
        df = self.load_co2()
        if df is None or df.empty:
            return 450.0

        time_2021 = self._map_date_to_dataset(at_time)

        df_copy = df.copy()
        df_copy["timestamp_naive"] = df_copy["timestamp"].dt.tz_localize(None)
        time_naive = time_2021.replace(tzinfo=None) if hasattr(time_2021, 'tzinfo') else time_2021

        df_copy["time_diff"] = abs(df_copy["timestamp_naive"] - pd.Timestamp(time_naive))
        closest = df_copy.nsmallest(10, "time_diff")

        if closest.empty:
            return 450.0

        # Average CO2 from closest readings
        avg_co2 = closest["co2_ppm"].mean()
        return float(avg_co2) if pd.notna(avg_co2) else 450.0


# Singleton instance
_loader: Optional[PLEIADataLoader] = None


def get_loader(data_path: Path) -> PLEIADataLoader:
    """Get or create PLEIAData loader instance."""
    global _loader
    if _loader is None or _loader.data_path != data_path:
        _loader = PLEIADataLoader(data_path)
    return _loader
