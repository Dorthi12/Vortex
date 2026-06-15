from pydantic import BaseModel, Field

class RagQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language question from farmer/expert")
    vector_database: str = Field("Qdrant", description="Vector storage backend: Qdrant or FAISS")

class RagQueryResponse(BaseModel):
    answer: str = Field(..., description="Generated answer with domain relevance")
    citations: list = Field(default_factory=list, description="List of source document citations")
