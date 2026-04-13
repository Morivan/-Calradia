import argparse
import statistics
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = int(round((len(ordered) - 1) * p))
    return ordered[index]


def worker(base_url: str, path: str, timeout: float) -> tuple[bool, float, int]:
    started = time.perf_counter()
    response = requests.get(f"{base_url.rstrip('/')}{path}", timeout=timeout)
    duration_ms = (time.perf_counter() - started) * 1000
    return response.ok, duration_ms, response.status_code


def run_load_test(base_url: str, path: str, total_requests: int, concurrency: int, timeout: float) -> dict:
    latencies: list[float] = []
    failures: list[int] = []
    lock = threading.Lock()
    started = time.perf_counter()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(worker, base_url, path, timeout) for _ in range(total_requests)]
        for future in as_completed(futures):
            ok, duration_ms, status_code = future.result()
            with lock:
                latencies.append(duration_ms)
                if not ok:
                    failures.append(status_code)

    total_time = time.perf_counter() - started
    success_count = total_requests - len(failures)
    return {
        "base_url": base_url,
        "path": path,
        "total_requests": total_requests,
        "concurrency": concurrency,
        "success_count": success_count,
        "failure_count": len(failures),
        "min_ms": round(min(latencies), 2) if latencies else 0,
        "avg_ms": round(statistics.mean(latencies), 2) if latencies else 0,
        "p95_ms": round(percentile(latencies, 0.95), 2) if latencies else 0,
        "max_ms": round(max(latencies), 2) if latencies else 0,
        "requests_per_second": round(total_requests / total_time, 2) if total_time else 0,
        "failure_statuses": failures,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Simple load test for Workshop API.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8001")
    parser.add_argument("--path", default="/api/bootstrap/")
    parser.add_argument("--requests", type=int, default=200)
    parser.add_argument("--concurrency", type=int, default=20)
    parser.add_argument("--timeout", type=float, default=10.0)
    args = parser.parse_args()

    result = run_load_test(args.base_url, args.path, args.requests, args.concurrency, args.timeout)
    for key, value in result.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
