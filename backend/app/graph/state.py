from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

class ChatState(TypedDict):
    # Annotated with add_messages ensures conversation history builds up
    messages: Annotated[list[BaseMessage], add_messages]