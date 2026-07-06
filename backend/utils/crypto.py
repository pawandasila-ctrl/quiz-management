import base64
import json
import hashlib
from typing import Type
from pydantic import BaseModel
from fastapi import HTTPException, status
from schemas.result import EncryptedPayload
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from config.settings import settings

def decrypt_payload(encrypted_data: str) -> dict:
    """
    Decrypts a base64-encoded AES-256-GCM payload.
    The first 12 bytes of the decoded data is the initialization vector (nonce),
    followed by the ciphertext and authentication tag.
    """
    try:
        # Decode base64
        data = base64.b64decode(encrypted_data)
        
        if len(data) < 12:
            raise ValueError("Payload too short to contain a valid IV.")
        
        nonce = data[:12]
        ciphertext = data[12:]
        
        key = hashlib.sha256(settings.API_ENCRYPTION_KEY.encode()).digest()
        
        aesgcm = AESGCM(key)
        
        decrypted = aesgcm.decrypt(nonce, ciphertext, None)
        return json.loads(decrypted.decode('utf-8'))
    except Exception as e:
        raise ValueError(f"Failed to decrypt payload: {str(e)}")


def decrypted_body(schema_class: Type[BaseModel]):
    """
    FastAPI Dependency Injection provider that decodes and validates
    an encrypted request payload using the specified Pydantic schema class.
    """
    async def dependency(payload_in: EncryptedPayload) -> BaseModel:
        try:
            decrypted_dict = decrypt_payload(payload_in.encrypted_data)
            return schema_class(**decrypted_dict)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to decrypt or parse payload: {str(e)}"
            )
    return dependency
