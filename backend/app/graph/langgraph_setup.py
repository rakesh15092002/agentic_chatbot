import os
from typing import Annotated, TypedDict
from dotenv import load_dotenv

# LangGraph & LangChain Imports
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

# Import your tools
from app.utils.tools import tools

load_dotenv()

# ==========================================
# 1. LLM SETUP
# ==========================================
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.1,
)

llm_with_tools = llm.bind_tools(tools)

# ==========================================
# 2. UNIVERSAL SYSTEM PROMPT
# ==========================================
UNIVERSAL_SYSTEM_PROMPT = """You are a highly capable AI assistant with access to real-time information and tools.

YOUR CORE CAPABILITIES:
1. **Search (duckduckgo_search)**: Get current information, news, facts about people, places, events
2. **Calculator**: Perform mathematical calculations
3. **Stock Prices (get_stock_price)**: Get real-time stock market data
4. **Weather (get_weather)**: Get current weather information

DECISION MAKING RULES - FOLLOW THESE STRICTLY:

### 🚫 WHEN TO ANSWER DIRECTLY (DO NOT USE TOOLS):
**Check this list FIRST. If the query falls here, use your internal knowledge.**
- **Coding & Technical Tasks**: Writing code (Python, JS, React, etc.), debugging, explaining syntax, or standard libraries (e.g., "Create an express server", "How does useEffect work?").
- **General Knowledge**: Static facts, history, science, definitions, and concepts that do not change frequently (e.g., "Who is Newton?", "What is photosynthesis?").
- **Chit-Chat**: Greetings, "How are you?", or questions about your identity.
- **Logic/Reasoning**: Questions requiring common sense or logical deduction without new data.

### ✅ WHEN TO USE TOOLS:

**1. Search (duckduckgo_search):**
- **ONLY** for real-time information or events happening **now** or very recently.
- Questions about current news, stock market trends, or "what happened today".
- Questions about specific people's *current* roles (e.g., "Who is the CEO of Twitter now?").
- If the user explicitly asks to "Search for..." or "Check the web".
- If you strictly do not know the answer from your internal memory.

**2. Calculator:**
- Any mathematical calculation request involving specific numbers.
- Complex arithmetic that is prone to error if done mentally.

**3. Stock Price:**
- Specific questions about current stock prices or ticker symbols.

**4. Weather:**
- Questions about current weather, forecasts, or temperature in specific locations.

RESPONSE GUIDELINES:

**DO:**
- Use tools proactively ONLY when real-time data is required.
- Provide direct, confident answers for coding and general topics WITHOUT searching.
- Synthesize information from multiple search results when search is actually used.

**DON'T:**
- **DO NOT SEARCH** for coding questions (e.g., "write a python script").
- Say "it seems" or "the search results mention" - just state the facts.
- Apologize for using tools.
- Make up information - use search ONLY when you are unsure.

Remember: Prioritize your internal knowledge for coding and general facts. Use tools only for real-time data."""

# ==========================================
# 3. STATE & NODES
# ==========================================
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

def chat_node(state: ChatState):
    """Enhanced agent node with better context management."""
    messages = state["messages"]
    
    # Add system message only if not present
    if not messages or not isinstance(messages[0], SystemMessage):
        sys_msg = SystemMessage(content=UNIVERSAL_SYSTEM_PROMPT)
        messages = [sys_msg] + messages
    
    # Smart context window management
    # Keep system message + last 15 conversation turns (30 messages)
    if len(messages) > 31:  # system + 30 messages
        messages = [messages[0]] + messages[-30:]
    
    # Invoke LLM
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

# Tool node
tool_node = ToolNode(tools)

# ==========================================
# 4. BUILD GRAPH (WITHOUT CHECKPOINTER)
# ==========================================
# We'll add the checkpointer dynamically in chat_service.py
graph = StateGraph(ChatState)

# Add Nodes
graph.add_node("agent", chat_node)
graph.add_node("tools", tool_node)

# Add Edges
graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", tools_condition)
graph.add_edge("tools", "agent")

# Don't compile here - we'll do it in chat_service with async checkpointer