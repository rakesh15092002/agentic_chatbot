import requests
import yfinance as yf
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# ==========================================
# 1. IMPROVED SEARCH TOOL
# ==========================================
class SearchInput(BaseModel):
    query: str = Field(
        description="Search query for finding current information, news, facts, or events. Be specific and include relevant keywords."
    )

@tool("duckduckgo_search", args_schema=SearchInput)
def duckduckgo_search(query: str) -> str:
    """
    Search the web for current information, news, events, and facts.
    
    Use this for:
    - Current events and news
    - Information about people's current positions or roles
    - Recent developments in any topic
    - Any fact that might have changed recently
    - General knowledge questions where you need verification
    
    Returns: Text with relevant search results
    """
    try:
        # Increase results for better coverage
        wrapper = DuckDuckGoSearchAPIWrapper(max_results=5)
        results = wrapper.run(query)
        
        if not results or results.strip() == "":
            return f"No search results found for '{query}'. Try rephrasing your search query."
        
        return results
    
    except Exception as e:
        return f"Search error: {str(e)}. Please try a different query."

# ==========================================
# 2. IMPROVED CALCULATOR
# ==========================================
class CalculatorInput(BaseModel):
    expression: str = Field(
        description="Mathematical expression to evaluate. Examples: '5 + 3', '100 * 2.5', '(10 + 5) / 3'"
    )

@tool("calculator", args_schema=CalculatorInput)
def calculator(expression: str) -> str:
    """
    Perform mathematical calculations.
    
    Supports: addition (+), subtraction (-), multiplication (*), division (/), parentheses
    Examples: '25 * 4', '(100 + 50) / 2', '3.14 * 10'
    
    Returns: The calculated result
    """
    try:
        # Security: only allow safe characters
        allowed_chars = set("0123456789+-*/(). ")
        if not all(char in allowed_chars for char in expression):
            return "Error: Expression contains invalid characters. Only use numbers and basic operators (+, -, *, /, parentheses)."
        
        # Evaluate safely
        result = eval(expression)
        return f"{expression} = {result}"
    
    except ZeroDivisionError:
        return "Error: Division by zero is not allowed."
    except Exception as e:
        return f"Calculation error: {str(e)}. Please check your expression."

# ==========================================
# 3. IMPROVED STOCK PRICE TOOL
# ==========================================
class StockInput(BaseModel):
    symbol: str = Field(
        description="Stock ticker symbol (e.g., 'AAPL' for Apple, 'GOOGL' for Google, 'TSLA' for Tesla)"
    )

@tool("get_stock_price", args_schema=StockInput)
def get_stock_price(symbol: str) -> str:
    """
    Get the latest stock price for a given ticker symbol.
    
    Examples: AAPL (Apple), MSFT (Microsoft), GOOGL (Google), TSLA (Tesla)
    
    Returns: Current stock price and currency
    """
    try:
        ticker = yf.Ticker(symbol.upper())
        
        # Try fast_info first
        price = ticker.fast_info.get('last_price')
        
        # Fallback to history
        if price is None:
            hist = ticker.history(period="1d")
            if not hist.empty:
                price = hist['Close'].iloc[-1]
        
        if price:
            currency = ticker.fast_info.get('currency', 'USD')
            return f"{symbol.upper()} is currently trading at {round(price, 2)} {currency}"
        else:
            return f"Could not retrieve price for {symbol.upper()}. Please verify the ticker symbol is correct."
    
    except Exception as e:
        return f"Error fetching stock price for {symbol}: {str(e)}. Make sure you're using a valid ticker symbol."

# ==========================================
# 4. IMPROVED WEATHER TOOL
# ==========================================
class WeatherInput(BaseModel):
    city: str = Field(
        description="City name to get weather for (e.g., 'London', 'New York', 'Tokyo', 'Mumbai')"
    )

@tool("get_weather", args_schema=WeatherInput)
def get_weather(city: str) -> str:
    """
    Get current weather information for a city.
    
    Returns: Temperature, weather condition, and humidity
    """
    try:
        url = f"https://wttr.in/{city}?format=j1"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            current = data['current_condition'][0]
            
            temp_c = current['temp_C']
            temp_f = current['temp_F']
            condition = current['weatherDesc'][0]['value']
            humidity = current['humidity']
            
            return f"Weather in {city.title()}: {temp_c}°C ({temp_f}°F), {condition}, Humidity: {humidity}%"
        else:
            return f"Could not find weather data for '{city}'. Please check the city name."
    
    except requests.exceptions.Timeout:
        return "Weather service timeout. Please try again."
    except Exception as e:
        return f"Error getting weather for {city}: {str(e)}"

# ==========================================
# EXPORT ALL TOOLS
# ==========================================
tools = [duckduckgo_search, calculator, get_stock_price, get_weather]