import os
import sqlite3
from typing import Annotated, TypedDict
from dotenv import load_dotenv

# LangGraph & LangChain Imports
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver

# Import your tools
from app.utils.tools import tools

load_dotenv()

# ==========================================
# 1. BETTER LLM SETUP
# ==========================================
llm = ChatGroq(
    model="llama-3.3-70b-versatile",  # Upgraded to 70B for better reasoning
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.1,  # Lower for more consistent, factual responses
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

**When to Use Search:**
- Questions about current events, news, or "what's happening"
- Questions about people's current positions/roles (president, PM, CEO, etc.)
- Any question that starts with: "who is the current...", "what's happening...", "latest news..."
- Questions about recent developments, ongoing situations
- Questions about any fact that could have changed recently
- If you're unsure about current information

**When to Use Calculator:**
- Any mathematical calculation request
- Questions with numbers and operations (multiply, divide, add, subtract)

**When to Use Stock Price:**
- Questions about stock prices, ticker symbols
- Market value questions

**When to Use Weather:**
- Questions about weather, temperature, climate in specific locations

RESPONSE GUIDELINES:

**DO:**
- Use tools proactively when needed
- Provide direct, confident answers based on tool results
- Synthesize information from multiple search results
- Be concise and clear
- If search finds relevant info, present it as factual

**DON'T:**
- Say "it seems" or "the search results mention" - just state the facts
- Apologize for using tools
- Explain the search process unless results are genuinely unclear
- Refuse to answer when you have tool access
- Make up information - use search when unsure

EXAMPLES OF PERFECT RESPONSES:

User: "Who is the prime minister of India?"
You: [Use search] → "Narendra Modi is the Prime Minister of India."

User: "What's happening in Bangladesh?"
You: [Use search] → "Recent developments in Bangladesh include: [list 2-3 key points from search]"

User: "Calculate 47 * 89"
You: [Use calculator] → "47 × 89 = 4,183"

User: "What actions has India taken regarding Bangladesh?"
You: [Use search with query: "India Bangladesh relations recent actions"] → "India has responded to the Bangladesh situation through: [summarize key diplomatic, security, or policy actions found]"

Remember: You have tools to get current information. Use them confidently and provide direct answers."""

# ==========================================
# 3. IMPROVED STATE & NODES
# ==========================================
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

def chat_node(state: ChatState):
    """Enhanced agent node with better context management."""
    messages = state["messages"]
    
    # Add system message
    sys_msg = SystemMessage(content=UNIVERSAL_SYSTEM_PROMPT)
    
    # Context window management - keep last 20 messages + system
    # This prevents token limit issues while maintaining context
    if len(messages) > 20:
        recent_messages = messages[-20:]
    else:
        recent_messages = messages
    
    final_messages = [sys_msg] + recent_messages
    
    # Invoke LLM
    response = llm_with_tools.invoke(final_messages)
    return {"messages": [response]}

# Tool node
tool_node = ToolNode(tools)

# ==========================================
# 4. BUILD GRAPH
# ==========================================
conn = sqlite3.connect("chatbot.db", check_same_thread=False)
checkpointer = SqliteSaver(conn=conn)

graph = StateGraph(ChatState)

# Add Nodes
graph.add_node("agent", chat_node)
graph.add_node("tools", tool_node)

# Add Edges
graph.add_edge(START, "agent")

# Conditional routing: agent decides to use tools or end
graph.add_conditional_edges(
    "agent",
    tools_condition,
)

# After tools, return to agent to process results
graph.add_edge("tools", "agent")

# Compile
chatbot = graph.compile(checkpointer=checkpointer)