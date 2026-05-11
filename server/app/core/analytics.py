from statistics import mean


def _pearson(xs: list[float], ys: list[float]) -> float:
    if len(xs) < 2 or len(xs) != len(ys):
        return 0.0

    x_avg = mean(xs)
    y_avg = mean(ys)
    numerator = sum((x - x_avg) * (y - y_avg) for x, y in zip(xs, ys))
    x_var = sum((x - x_avg) ** 2 for x in xs)
    y_var = sum((y - y_avg) ** 2 for y in ys)
    denominator = (x_var * y_var) ** 0.5
    return round(numerator / denominator, 4) if denominator else 0.0


def correlation(region: str, points: list[dict], years: int) -> dict:
    window = points[-years:]
    xs = [point["temperature"] for point in window]
    ys = [point["yield_tons"] for point in window]
    value = _pearson(xs, ys)
    return {
        "region": region,
        "years": years,
        "value": value,
        "percent": round(value * 100, 2),
        "direction": "positive" if value >= 0 else "negative",
    }


def trend_detection(region: str, points: list[dict], years: int) -> dict:
    window = points[-years:]
    if len(window) < 2:
        return {"region": region, "years": years, "temperature_delta": 0.0, "yield_delta": 0.0}

    first = window[0]
    last = window[-1]
    return {
        "region": region,
        "years": years,
        "temperature_delta": round(last["temperature"] - first["temperature"], 3),
        "yield_delta": round(last["yield_tons"] - first["yield_tons"], 3),
        "signal": "warming" if last["temperature"] >= first["temperature"] else "cooling",
    }


def anomaly_detection(region: str, points: list[dict], years: int) -> dict:
    window = points[-years:]
    if not window:
        return {"region": region, "years": years, "temperature_anomalies": [], "yield_anomalies": []}

    temp_avg = mean(point["temperature"] for point in window)
    yield_avg = mean(point["yield_tons"] for point in window)
    temp_anomalies = [
        point for point in window if abs(point["temperature"] - temp_avg) >= 0.9
    ]
    yield_anomalies = [
        point for point in window if abs(point["yield_tons"] - yield_avg) >= yield_avg * 0.08
    ]
    return {
        "region": region,
        "years": years,
        "temperature_anomalies": temp_anomalies,
        "yield_anomalies": yield_anomalies,
    }
