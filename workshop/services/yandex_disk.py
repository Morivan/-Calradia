import io
import requests
import openpyxl
from django.conf import settings

DISK_API = "https://cloud-api.yandex.net/v1/disk/resources"


class YandexDiskError(RuntimeError):
    pass


def _headers() -> dict:
    token = getattr(settings, "YANDEX_DISK_TOKEN", "")
    if not token:
        raise YandexDiskError("YANDEX_DISK_TOKEN не настроен.")
    return {"Authorization": f"OAuth {token}"}


def _download_xlsx(disk_path: str) -> openpyxl.Workbook:
    r = requests.get(f"{DISK_API}/download", params={"path": disk_path}, headers=_headers(), timeout=30)
    r.raise_for_status()
    download_url = r.json()["href"]
    data = requests.get(download_url, timeout=30)
    data.raise_for_status()
    return openpyxl.load_workbook(io.BytesIO(data.content))


def _upload_xlsx(disk_path: str, wb: openpyxl.Workbook) -> None:
    r = requests.get(
        f"{DISK_API}/upload",
        params={"path": disk_path, "overwrite": "true"},
        headers=_headers(),
        timeout=30,
    )
    r.raise_for_status()
    upload_url = r.json()["href"]
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    put = requests.put(upload_url, data=buf, timeout=60)
    put.raise_for_status()


def append_row(disk_path: str, row: list) -> None:
    """Download XLSX from Yandex Disk, append a row, upload back."""
    wb = _download_xlsx(disk_path)
    ws = wb.active
    ws.append(row)
    _upload_xlsx(disk_path, wb)
