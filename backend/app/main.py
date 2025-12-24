from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.chat_routes import router as chat_router
from app.routes.thread_routes import router as thread_router
from app.db.sqlite_conn import init_db

app = FastAPI(title="LangGraph Chatbot with Threads")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    # Add your frontend URL here (usually localhost:3000 for React or 5173 for Vite)
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database on Startup
init_db()

# Include Routers
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(thread_router, prefix="/thread", tags=["Thread"])

@app.get("/")
def root():
    return {"message": "Chatbot backend is running!"}