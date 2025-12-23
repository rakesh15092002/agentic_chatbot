# 🔴 CHANGED: Import 'graph' instead of 'chatbot'
from app.graph.langgraph_setup import graph 
from app.services.thread_service import save_message
from langchain_core.messages import HumanMessage
# ✅ NEW: Import Async Saver
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver 

async def stream_chat_response(message: str, thread_id: str):
    """
    Creates an Async Checkpointer, compiles the graph, and streams the response.
    """
    
    config = {
        "configurable": {"thread_id": thread_id},
        "metadata": {"thread_id": thread_id, "run_name": "chat_stream"}
    }
    
    input_message = HumanMessage(content=message)
    full_response = ""

    # 1. Save User Message to DB (Frontend history)
    save_message(thread_id, "user", message)

    # 2. Open Async Database Connection using 'async with'
    # This automatically handles opening and closing the DB connection safely
    async with AsyncSqliteSaver.from_conn_string("chatbot.db") as checkpointer:
        
        # 3. Compile the graph HERE with the active checkpointer
        # This replaces the old 'chatbot' object we used to import
        chatbot = graph.compile(checkpointer=checkpointer)

        # 4. Stream events
        async for event in chatbot.astream_events(
            {"messages": [input_message]}, 
            config=config, 
            version="v1"
        ):
            kind = event["event"]
            
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    full_response += content
                    yield content

    # 5. Save the Full AI Response to DB
    save_message(thread_id, "assistant", full_response)