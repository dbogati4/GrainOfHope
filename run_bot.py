import asyncio
from rag_bot import HungerRAGBot

bot = HungerRAGBot()

async def main():
    updated = await bot.update_knowledge_base()
    print("Knowledge base updated:", updated)
    res = bot.chat("What is the global hunger rate in 2023?")
    print(res)

asyncio.run(main())
