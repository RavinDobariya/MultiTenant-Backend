import cloudinary
import cloudinary.uploader 
from app.utils.config import settings
import uuid
import requests

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


def file_streamer(source:str):
    #online file streaming
    if source.startswith("http"):
        file_data = requests.get(source, stream=True)   #gives data little by little...don't load entire file into memory
                                                        #stream = False => load entire file into memory then send to client

        for chunk in file_data.iter_content(chunk_size=1024 * 1024):        #read 1MB at a time
                yield chunk

    #local file streaming
    else:
        with open(source, "rb") as file_local:
            while chunk := file_local.read(1024 * 1024):
                yield chunk


"""
#Local file streaming
def stream_local():
    with open("video.mp4", "rb") as f:
        while chunk := f.read(1024 * 1024):
            yield chunk
            

#Online file streaming            
import requests
def stream_online(url):
    r = requests.get(url, stream=True)

    for chunk in r.iter_content(chunk_size=1024 * 1024):
        yield chunk   
        
def stream_file(source):  #source can be local => file path or online => file url
              
"""