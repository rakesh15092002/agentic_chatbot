import os
import sqlite3
from typing import Annotated, TypedDict
from dotenv import load_dotenv

# LangGraph & LangChain Imports
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver

# IMPORTANT: Import your tools from the new file
from app.utils.tools import tools

load_dotenv()

# ==========================================
# 1. SETUP LLM
# ==========================================
# Initialize Groq
llm = ChatGroq(
    model="llama-3.1-8b-instant", 
    api_key=os.getenv("GROQ_API_KEY")
)

# Bind the imported tools to the LLM
llm_with_tools = llm.bind_tools(tools)

# ==========================================
# 2. STATE & NODES
# ==========================================
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

def chat_node(state: ChatState):
    """Agent node that decides what to do."""
    messages = state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

# Create the ToolNode using the imported list
tool_node = ToolNode(tools)

# ==========================================
# 3. BUILD GRAPH
# ==========================================
conn = sqlite3.connect("chatbot.db", check_same_thread=False)
checkpointer = SqliteSaver(conn=conn)

graph = StateGraph(ChatState)

# Add Nodes
graph.add_node("agent", chat_node)
graph.add_node("tools", tool_node)

# Add Edges
graph.add_edge(START, "agent")

# Logic: Agent -> (Check Condition) -> Tools OR End
graph.add_conditional_edges(
    "agent",
    tools_condition,
)

# Logic: Tools -> Agent (Loop back to let agent interpret results)
graph.add_edge("tools", "agent")

# Compile
chatbot = graph.compile(checkpointer=checkpointer)