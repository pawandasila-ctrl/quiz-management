import cloudinary
import cloudinary.uploader
from config.settings import settings
import anyio
import base64

# Configure Cloudinary credentials
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

def _sync_upload(file_data: bytes, folder: str = "quiz_images") -> dict:
    """Synchronous blocker upload function to be run in a thread pool."""
    return cloudinary.uploader.upload(
        file_data,
        folder=folder,
        resource_type="image"
    )

def _sync_upload_base64(base64_str: str, folder: str = "quiz_images") -> dict:
    """Synchronous blocker upload function for base64 encoded strings."""
    return cloudinary.uploader.upload(
        base64_str,
        folder=folder,
        resource_type="image"
    )

async def upload_image_bytes(file_bytes: bytes, folder: str = "quiz_images") -> str:
    """
    Asynchronously uploads raw file bytes to Cloudinary.
    Runs the blocking SDK upload in a separate thread to prevent event loop blockage.
    """
    result = await anyio.to_thread.run_sync(_sync_upload, file_bytes, folder)
    return result.get("secure_url")

async def upload_image_base64(base64_str: str, folder: str = "quiz_images") -> str:
    """
    Asynchronously uploads a base64 encoded image string to Cloudinary.
    """
    result = await anyio.to_thread.run_sync(_sync_upload_base64, base64_str, folder)
    return result.get("secure_url")
