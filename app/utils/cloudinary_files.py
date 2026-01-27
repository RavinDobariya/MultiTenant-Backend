import cloudinary
import cloudinary.uploader 
from app.utils.config import settings
import uuid

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

def upload_file_to_cloudinary(file_bytes: bytes, filename: str,content_type):

    # create unique public_id (avoid overwrite)
    name = filename.rsplit(".", 1)[0]           #right side split start....only 1 time
    unique_name = f"{uuid.uuid4().hex}_{name}"

    result = cloudinary.uploader.upload(
        file_bytes,
        folder=settings.CLOUDINARY_FOLDER,           # optional
        public_id=unique_name,
        resource_type="auto",
        overwrite=False,        #public_id already exists => Cloudinary will NOT replace it.
        unique_filename=True
    )

    return result["secure_url"]