import os
from pathlib import Path
from datetime import datetime
import asyncio
import logging
from dotenv import load_dotenv




from langchain_community.document_loaders import PyPDFLoader
from langchain_community.text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.chat_models import ChatOpenAI
from langchain_community.chains import ConversationalRetrievalChain
from langchain_community.memory import ConversationBufferWindowMemory
from langchain_community.prompts import PromptTemplate

import aiohttp
import aiofiles

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load OpenAI key
load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")


class UNDataFetcher:
    """Fetch UN hunger reports"""

    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.data_dir.mkdir(exist_ok=True)
        self.direct_urls = [
            {"url": "https://www.fao.org/3/cc3017en/cc3017en.pdf", "name": "FAO_SOFI_2023.pdf"},
            {"url": "https://www.globalhungerindex.org/pdf/en/2023.pdf", "name": "GHI_2023.pdf"},
            {"url": "https://docs.wfp.org/api/documents/WFP-0000147443/download/", "name": "WFP_Global_2023.pdf"},
        ]

    async def download_report(self, url: str, filename: str) -> str | None:
        filepath = self.data_dir / filename
        if filepath.exists():
            return str(filepath)
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        async with aiofiles.open(filepath, 'wb') as f:
                            async for chunk in response.content.iter_chunked(8192):
                                await f.write(chunk)
                        logger.info(f"Downloaded {filename}")
                        return str(filepath)
        except Exception as e:
            logger.error(f"Failed to download {filename}: {e}")
            return None

    async def fetch_all_reports(self):
        tasks = [self.download_report(r["url"], r["name"]) for r in self.direct_urls]
        results = await asyncio.gather(*tasks)
        return [r for r in results if r]


class HungerRAGBot:
    """RAG bot for hunger data"""

    def __init__(self, data_dir="hunger_data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)

        self.embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.1, max_tokens=2000)

        self.data_fetcher = UNDataFetcher(self.data_dir)
        self.vector_store = None
        self.qa_chain = None
        self.memory = ConversationBufferWindowMemory(k=5, memory_key="chat_history", return_messages=True)
        self.last_update = None

    async def update_knowledge_base(self, force_update=False) -> bool:
        if not force_update and self.last_update and (datetime.now() - self.last_update).days < 1:
            return False

        downloaded_files = await self.data_fetcher.fetch_all_reports()
        if not downloaded_files:
            return False

        documents = []
        for file in downloaded_files:
            loader = PyPDFLoader(file)
            docs = loader.load()
            for doc in docs:
                doc.metadata["file_name"] = Path(file).name
            documents.extend(docs)

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=200)
        splits = text_splitter.split_documents(documents)

        self.vector_store = Chroma.from_documents(splits, embedding=self.embeddings,
                                                  persist_directory=str(self.data_dir / "chroma_db"))

        system_template = """You are an expert AI assistant specializing in hunger data.

Context: {context}
Chat History: {chat_history}
Question: {question}
Answer comprehensively, include statistics and cite sources."""
        prompt = PromptTemplate(input_variables=["context", "chat_history", "question"], template=system_template)
        self.qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 5}),
            memory=self.memory,
            combine_docs_chain_kwargs={"prompt": prompt},
            return_source_documents=True
        )
        self.last_update = datetime.now()
        return True

    def chat(self, question: str):
        if not self.qa_chain:
            return {"answer": "Bot not ready. Update knowledge base first.", "sources": []}
        response = self.qa_chain({"question": question})
        sources = [{"file": doc.metadata.get("file_name", "N/A"),
                    "content_preview": doc.page_content[:200]+"..."} for doc in response.get("source_documents", [])[:3]]
        return {"answer": response["answer"], "sources": sources}
