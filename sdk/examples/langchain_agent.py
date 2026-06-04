import os
import sys
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI
from searchmind import SearchMindClient
from searchmind.langchain_tool import SearchMindTool

def main():
    searchmind_api_key = os.environ.get("SEARCHMIND_API_KEY")
    openai_api_key = os.environ.get("OPENAI_API_KEY")

    if not searchmind_api_key or not openai_api_key:
        print("Error: Please set both SEARCHMIND_API_KEY and OPENAI_API_KEY environment variables.")
        sys.exit(1)

    print("Initializing SearchMind client and LangChain tool...")
    client = SearchMindClient(api_key=searchmind_api_key)
    search_tool = SearchMindTool(client=client)

    # Initialize LLM (e.g. GPT-4o-mini or other configured models)
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=openai_api_key)

    # Create ReAct Agent with SearchMind search tool
    tools = [search_tool]
    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True
    )

    query = "What are the latest updates on Python async frameworks in 2025/2026?"
    print(f"\nRunning LangChain Agent for: '{query}'")
    try:
        response = agent.run(query)
        print("\nAgent Output:")
        print(response)
    except Exception as e:
        print(f"\nAgent execution failed: {e}")

if __name__ == "__main__":
    main()
