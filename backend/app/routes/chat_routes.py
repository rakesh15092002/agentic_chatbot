from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.schemas.chat_schema import ChatRequest
# Make sure you import the new streaming function we created in Step 1
from app.services.chat_service import stream_chat_response 

router = APIRouter()

@router.post("/send")
async def chat_send(request: ChatRequest):
    """
    Stream message to chatbot with thread support.
    Returns a stream of text chunks instead of a single JSON object.
    """
    
    # We call the generator function inside StreamingResponse
    return StreamingResponse(
        stream_chat_response(request.message, request.thread_id),
        media_type="text/event-stream"
    )