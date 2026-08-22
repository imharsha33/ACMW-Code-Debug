from fastapi import APIRouter, Depends
from app.schemas.submission import CodeRunRequest, CodeRunResponse
from app.services.execution_service import ExecutionService
from app.core.dependencies import get_execution_service, get_current_user
from app.models.entities import UserEntity

router = APIRouter(prefix="/code", tags=["Code Execution"])

@router.post("/run", response_model=CodeRunResponse)
def run_code(
    req: CodeRunRequest,
    exec_service: ExecutionService = Depends(get_execution_service),
):
    """Run code in safe sandbox abstraction. Does NOT consume question attempt limits."""
    return exec_service.execute_code(req)
