import os
import warnings
from dotenv import load_dotenv

# Suppress warnings & setup environment
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'
warnings.filterwarnings("ignore")
load_dotenv()

# Document loading & splitting
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Embeddings, vector store and FAISS
from langchain_ollama import OllamaEmbeddings, ChatOllama
import faiss
from langchain_community.vectorstores import FAISS
from langchain_community.docstore.in_memory import InMemoryDocstore

# RAG chain components
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnableLambda, RunnablePassthrough


def build_rag_chain(pdf_path: str = "static/gov.pdf"):
    # 1. Load PDF
    loader = PyMuPDFLoader(pdf_path)
    docs = loader.load()

    # 2. Split into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_documents(docs)

    # 3. Embeddings & FAISS
    embeddings = OllamaEmbeddings(model='nomic-embed-text', base_url="http://localhost:11434")
    sample_vec = embeddings.embed_query("sample text")
    index = faiss.IndexFlatL2(len(sample_vec))
    vector_store = FAISS(
        embedding_function=embeddings,
        index=index,
        docstore=InMemoryDocstore(),
        index_to_docstore_id={}
    )
    vector_store.add_documents(chunks)

    # 4. Retriever with MMR
    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={'k': 3, 'fetch_k': 20, 'lambda_mult': 0.8}
    )

    # 5. Prompt template
    prompt_text = (
        "You are an expert assistant for answering questions.\n"
        "Use ONLY the provided context. Do not hallucinate.\n"
        "Answer in clear, concise BULLET POINTS.\n"
        "If you don't know the answer from context, say: 'I don't know based on provided information.'\n\n"
        "Question: {question}\n"
        "Context:\n{context}\n"
        "Answer:"
    )
    prompt = ChatPromptTemplate.from_template(prompt_text)

    # 6. LLM model
    model = ChatOllama(
        model="llama3",
        base_url="http://localhost:11434",
        model_kwargs={"temperature": 0.0, "max_new_tokens": 256}
    )

    # 7. Chain assembly
    def format_docs(docs):
        if not docs:
            return "No relevant information found in the context."
        return "\n\n".join(d.page_content for d in docs)

    rag_chain = (
        {"context": retriever | RunnableLambda(format_docs),
         "question": RunnablePassthrough()}
        | prompt
        | model
        | StrOutputParser()
    )

    return rag_chain


# Build RAG chain once
rag_chain = build_rag_chain()


def rag_query(question: str) -> str:
    """Invoke the RAG chain on a user question and return the answer."""
    return rag_chain.invoke(question)
