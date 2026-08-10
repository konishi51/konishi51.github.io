#!/usr/bin/env python3
"""Upload one staged article image with a signed Cloudinary request."""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
from pathlib import Path, PurePosixPath
import re
import secrets
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen


ALLOWED_SUFFIXES = {".gif", ".jpeg", ".jpg", ".png", ".webp"}
MAX_BYTES = 20 * 1024 * 1024
PUBLIC_ID_RE = re.compile(r"^[A-Za-z0-9_./-]+$")


def parse_cloudinary_url(value: str) -> tuple[str, str, str]:
    parsed = urlparse(value)
    if (
        parsed.scheme != "cloudinary"
        or not parsed.hostname
        or not parsed.username
        or not parsed.password
    ):
        raise ValueError("CLOUDINARY_URL is not a complete cloudinary:// URL")
    return parsed.hostname, unquote(parsed.username), unquote(parsed.password)


def signature_for(parameters: dict[str, str], api_secret: str) -> str:
    canonical = "&".join(f"{key}={parameters[key]}" for key in sorted(parameters))
    return hashlib.sha1(f"{canonical}{api_secret}".encode()).hexdigest()


def find_image(root: Path) -> tuple[Path, str]:
    if not root.is_dir():
        raise ValueError(f"upload directory does not exist: {root}")

    candidates = [path for path in root.rglob("*") if path.is_file()]
    if len(candidates) != 1:
        raise ValueError(
            f"upload directory must contain exactly one file; found {len(candidates)}"
        )

    image = candidates[0]
    if image.is_symlink():
        raise ValueError("symbolic links are not accepted")
    if image.suffix.lower() not in ALLOWED_SUFFIXES:
        raise ValueError(f"unsupported image type: {image.suffix}")
    if image.stat().st_size > MAX_BYTES:
        raise ValueError(f"image exceeds the {MAX_BYTES}-byte limit")

    relative = PurePosixPath(image.relative_to(root).as_posix())
    public_id = str(relative.with_suffix(""))
    if public_id.startswith("/") or ".." in relative.parts:
        raise ValueError("image path must stay inside the upload directory")
    if not PUBLIC_ID_RE.fullmatch(public_id):
        raise ValueError("image path contains unsupported characters")
    return image, public_id


def multipart_body(fields: dict[str, str], image: Path) -> tuple[bytes, str]:
    boundary = f"----lackthereof{secrets.token_hex(16)}"
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.extend(
            [
                f"--{boundary}\r\n".encode(),
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode(),
                value.encode(),
                b"\r\n",
            ]
        )

    mime_type = mimetypes.guess_type(image.name)[0] or "application/octet-stream"
    chunks.extend(
        [
            f"--{boundary}\r\n".encode(),
            (
                'Content-Disposition: form-data; name="file"; '
                f'filename="{image.name}"\r\n'
            ).encode(),
            f"Content-Type: {mime_type}\r\n\r\n".encode(),
            image.read_bytes(),
            b"\r\n",
            f"--{boundary}--\r\n".encode(),
        ]
    )
    return b"".join(chunks), boundary


def upload(image: Path, public_id: str, cloudinary_url: str) -> dict[str, object]:
    cloud_name, api_key, api_secret = parse_cloudinary_url(cloudinary_url)
    signed = {
        "overwrite": "true",
        "public_id": public_id,
        "timestamp": str(int(time.time())),
    }
    fields = {
        **signed,
        "api_key": api_key,
        "signature": signature_for(signed, api_secret),
    }
    body, boundary = multipart_body(fields, image)
    request = Request(
        f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=60) as response:
            result = json.load(response)
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Cloudinary rejected the upload ({exc.code}): {detail}") from exc
    except URLError as exc:
        raise RuntimeError(f"Cloudinary upload failed: {exc.reason}") from exc

    secure_url = result.get("secure_url")
    if not isinstance(secure_url, str) or not secure_url.startswith("https://"):
        raise RuntimeError("Cloudinary response did not contain a secure image URL")
    if result.get("public_id") != public_id:
        raise RuntimeError("Cloudinary response public_id did not match the requested path")

    return {
        "public_id": public_id,
        "secure_url": secure_url,
        "format": result.get("format"),
        "bytes": result.get("bytes"),
        "width": result.get("width"),
        "height": result.get("height"),
        "source_sha256": hashlib.sha256(image.read_bytes()).hexdigest(),
    }


def self_test() -> None:
    assert parse_cloudinary_url("cloudinary://key:sec%2Fret@example") == (
        "example",
        "key",
        "sec/ret",
    )
    assert signature_for({"timestamp": "1", "public_id": "article/test"}, "secret") == (
        "8a0402e7a87fa987e2fff77984a70d706b20ca36"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("upload_dir", nargs="?", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        print("PASS  Cloudinary upload helper self-test")
        return 0
    if args.upload_dir is None or args.output is None:
        parser.error("upload_dir and --output are required")

    try:
        image, public_id = find_image(args.upload_dir)
        result = upload(image, public_id, os.environ.get("CLOUDINARY_URL", ""))
        args.output.write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"ERROR {exc}", file=sys.stderr)
        return 1

    print(f"Uploaded {public_id}: {result['secure_url']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
