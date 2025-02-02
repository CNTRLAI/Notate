class ModelLoadError(Exception):
    """Exception raised when there is an error loading a model."""
    pass

class ModelNotFoundError(Exception):
    """Exception raised when a requested model cannot be found."""
    pass

class ModelDownloadError(Exception):
    """Exception raised when there is an error downloading a model."""
    pass
