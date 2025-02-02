from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
import jwt

import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SECRET_KEY = os.environ.get("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("Could not get JWT secret for API key authorization")


async def get_optional_token(token: Optional[str] = Depends(oauth2_scheme)):
    return token


async def api_key_auth(token: Optional[str] = Depends(get_optional_token)):
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("userId")
        logger.info(f"User ID: {user_id}")
        if user_id is None:
            return None
        return user_id
    except jwt.exceptions.InvalidTokenError:
        logger.error("Invalid token")
        return None
