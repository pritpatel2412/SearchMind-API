import os
import sys
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from searchmind import SearchMindClient
from searchmind.langgraph_tool import create_searchmind_tools

def main():
    searchmind_api_key = os.environ.get("SEARCHMIND_API_KEY")
    openai_api_key = os.environ.get("OPENAI_API_KEY")

    if not searchmind_api_key or not openai_api_key:
        print("Error: Please set both SEARCHMIND_API_KEY and OPENAI_API_KEY environment variables.")
        sys.exit(1)

    print("Initializing SearchMind Client and LangGraph tools...")
    client = SearchMindClient(api_key=searchmind_api_key)
    tools = create_searchmind_tools(client)

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=openai_api_key)
    agent = create_react_agent(llm, tools)

    query = "Research modern vector databases in 2025/2026 and summarize findings."
    print(f"\nRunning LangGraph Agent for: '{query}'")
    
    try:
        inputs = {"messages": [("user", query)]}
        for chunk in agent.stream(inputs, stream_mode="values"):
            message = chunk["messages"][-1]
            if hasattr(message, "content") and message.content:
                print(f"\n[{message.type.upper()}]:")
                print(message.content)
    except Exception as e:
        print(f"\nAgent execution failed: {e}")

if __name__ == "__main__":
    main()
