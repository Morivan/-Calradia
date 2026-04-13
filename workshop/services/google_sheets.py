import csv
import io
from urllib.parse import quote

import requests


def extract_sheet_id(sheet_url: str) -> str | None:
    marker = "/spreadsheets/d/"
    if marker not in sheet_url:
        return None
    return sheet_url.split(marker, 1)[1].split("/", 1)[0]


def build_csv_url(sheet_url: str, sheet_name: str) -> str:
    if "gviz/tq" in sheet_url or "output=csv" in sheet_url or "/export?" in sheet_url:
        return sheet_url
    sheet_id = extract_sheet_id(sheet_url)
    if not sheet_id:
        raise ValueError("Не удалось определить ID Google Sheets.")
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={quote(sheet_name)}"


def fetch_csv_rows(sheet_url: str, sheet_name: str) -> list[list[str]]:
    response = requests.get(build_csv_url(sheet_url, sheet_name), timeout=20)
    response.raise_for_status()
    content = response.text.lstrip("\ufeff")
    reader = csv.reader(io.StringIO(content))
    return [[cell.strip() for cell in row] for row in reader if any(cell.strip() for cell in row)]
