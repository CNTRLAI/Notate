import re


def sanitize_collection_name(name):
    try:
        sanitized = re.sub(r'[^\w\-]', '_', name)
        sanitized = re.sub(r'^[^\w]|[^\w]$', '', sanitized)
        sanitized = re.sub(r'\.{2,}', '_', sanitized)

        if len(sanitized) < 3:
            sanitized = sanitized.ljust(3, "_")
        elif len(sanitized) > 63:
            sanitized = sanitized[:63]
        return sanitized
    except Exception as e:
        print(f"Error sanitizing collection name: {str(e)}")
        return None
