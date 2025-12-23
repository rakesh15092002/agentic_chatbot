import requests
import yfinance as yf
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# --------------------------
# 1. Search Tool
# --------------------------
wrapper = DuckDuckGoSearchAPIWrapper(max_results=2)
search_tool = DuckDuckGoSearchRun(api_wrapper=wrapper)

# --------------------------
# 2. Calculator Tool (SIMPLIFIED)
# --------------------------
# We changed this to take a SINGLE string "expression".
# This is much easier for the Llama 3.1 8b model to use successfully.
class CalculatorInput(BaseModel):
    expression: str = Field(description="The math expression to evaluate (e.g., '200 * 5', '10 + 5').")

@tool("calculator", args_schema=CalculatorInput)
def calculator(expression: str) -> dict:
    """
    Useful for performing math. 
    Accepts an expression like "2 * 5" or "100 / 4".
    """
    try:
        # cleanup input to prevent unsafe execution
        allowed_chars = "0123456789+-*/(). "
        if any(char not in allowed_chars for char in expression):
            return {"error": "Invalid characters in math expression."}
        
        # Evaluate the math string
        result = eval(expression)
        return {"expression": expression, "result": result}
    except Exception as e:
        return {"error": f"Math error: {str(e)}"}

# --------------------------
# 3. Stock Price Tool
# --------------------------
class StockInput(BaseModel):
    symbol: str = Field(description="The stock ticker symbol (e.g., 'AAPL', 'NVDA')")

@tool("get_stock_price", args_schema=StockInput)
def get_stock_price(symbol: str) -> dict:
    """Fetch latest stock price using Yahoo Finance."""
    try:
        ticker = yf.Ticker(symbol)
        price = ticker.fast_info.get('last_price')
        
        if price is None:
            # Fallback method
            hist = ticker.history(period="1d")
            if not hist.empty:
                price = hist['Close'].iloc[-1]

        if price:
            return {
                "symbol": symbol.upper(),
                "price": round(price, 2),
                "currency": ticker.fast_info.get('currency', 'USD')
            }
        else:
            return {"error": f"Could not fetch price for {symbol}"}
    except Exception as e:
        return {"error": str(e)}

# --------------------------
# 4. Weather Tool
# --------------------------
class WeatherInput(BaseModel):
    city: str = Field(description="The city name (e.g. 'Paris', 'Tokyo')")

@tool("get_weather", args_schema=WeatherInput)
def get_weather(city: str) -> dict:
    """Get current weather for a city."""
    try:
        url = f"https://wttr.in/{city}?format=j1"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            current = data['current_condition'][0]
            return {
                "city": city,
                "temp": f"{current['temp_C']}°C",
                "desc": current['weatherDesc'][0]['value'],
                "humidity": f"{current['humidity']}%"
            }
        return {"error": "City not found"}
    except Exception as e:
        return {"error": str(e)}

# Export
tools = [search_tool, calculator, get_stock_price, get_weather]