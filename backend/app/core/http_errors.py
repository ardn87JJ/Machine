from fastapi import HTTPException, status


class ConfigurationError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def configuration_http_exception(error: ConfigurationError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "code": error.code,
            "message": error.message,
        },
    )
