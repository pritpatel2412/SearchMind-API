import secrets
import hashlib

def generate_api_key_pair() -> tuple[str, str, str]:
    """
    Generates a new secure API key.
    
    Returns:
        tuple[str, str, str]: (raw_key, prefix, hashed_key)
        - raw_key: The plain text key (sm_live_...) returned only once.
        - prefix: A visual identifier (sm_live_abcd) shown to users.
        - hashed_key: SHA-256 hashed key stored securely in the database.
    """
    raw = "sm_live_" + secrets.token_urlsafe(32)
    prefix = raw[:12]
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, prefix, hashed

def hash_api_key(raw_key: str) -> str:
    """
    Hashes a raw key with SHA-256.
    """
    return hashlib.sha256(raw_key.encode()).hexdigest()
