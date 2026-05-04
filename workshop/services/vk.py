import re


def _largest_photo_url(photo: dict) -> str:
    sizes = photo.get("sizes", [])
    if not sizes:
        return ""
    best = max(sizes, key=lambda s: s.get("width", 0) * s.get("height", 0))
    return best.get("url", "")


def _clean_text(text: str) -> str:
    # Convert VK mentions [id123|Name] and [club123|Name] → Name
    text = re.sub(r'\[(?:id|club|public)\d+\|([^\]]+)\]', r'\1', text)
    # Strip leftover square-bracket constructs
    text = re.sub(r'\[[^\]]{1,64}\]', '', text)
    return text.strip()


def parse_post(post: dict) -> tuple[str, list[str]]:
    """Return (formatted_text, photo_urls) for a VK wall post object."""
    text = _clean_text(post.get("text", ""))

    photos: list[str] = []
    for att in post.get("attachments", []):
        if att.get("type") == "photo":
            url = _largest_photo_url(att["photo"])
            if url:
                photos.append(url)
        elif att.get("type") == "link":
            link_url = att["link"].get("url", "")
            title = att["link"].get("title", "")
            if link_url and link_url not in text:
                text = f"{text}\n{title + ': ' if title else ''}{link_url}".strip()

    # Append VK permalink
    owner_id = post.get("owner_id", "")
    post_id = post.get("id", "")
    if owner_id and post_id:
        vk_url = f"https://vk.com/wall{owner_id}_{post_id}"
        text = f"{text}\n\n🔗 {vk_url}".strip()

    # Telegram message limit: 4096 for text, 1024 for caption
    limit = 1024 if photos else 4096
    if len(text) > limit:
        text = text[: limit - 3] + "..."

    return text, photos
