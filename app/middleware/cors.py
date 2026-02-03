from fastapi.middleware.cors import CORSMiddleware
from app.main import app

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.0.116:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

""" 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],        #frontend app running on localhost:3000
    allow_credentials=True,
    allow_methods=["*"],            #"GET","POST","PATCH","DELETE"
    allow_headers=["*"],            #"Authorization","Content-Type", "Accept"
)                                       => Authorization → Sends the user’s token/credentials for authentication.
                                        => Content-Type → what client send to server as request
                                        => Accept → what client want back as response
"""