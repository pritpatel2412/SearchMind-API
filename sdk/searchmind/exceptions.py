class SearchMindError(Exception):
    """Base exception class for SearchMind SDK errors."""
    def __init__(self, message: str, status_code: int = None, response_text: str = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.response_text = response_text


class AuthError(SearchMindError):
    """Raised when authentication fails (e.g. invalid or expired API key)."""
    pass


class RateLimitError(SearchMindError):
    """Raised when the rate limit per minute is exceeded."""
    pass


class QuotaExceededError(SearchMindError):
    """Raised when the monthly request limit is reached."""
    pass
