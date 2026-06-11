import time
import logging
from typing import Callable, Any, Type, Tuple
from ..config.settings import settings

logger = logging.getLogger(__name__)

class MaxRetriesExceededException(Exception):
    """Exception raised when all retry attempts fail."""
    pass

def execute_with_retry(
    action: Callable[..., Any],
    *args: Any,
    exceptions: Tuple[Type[BaseException], ...] = (Exception,),
    **kwargs: Any
) -> Any:
    """
    Executes a callable with exponential backoff retry logic.
    If it fails after the maximum attempts (defined in settings), it raises MaxRetriesExceededException.
    """
    max_attempts = settings.MAX_RETRY_ATTEMPTS
    initial_interval = settings.RETRY_INITIAL_INTERVAL
    backoff_coeff = settings.RETRY_BACKOFF_COEFF

    last_exception = None

    for attempt in range(1, max_attempts + 1):
        try:
            return action(*args, **kwargs)
        except exceptions as e:
            last_exception = e
            action_name = getattr(action, "__name__", str(action))
            logger.warning(
                f"Attempt {attempt}/{max_attempts} failed for action '{action_name}' with error: {e}. "
                f"Is recoverable: True."
            )
            
            if attempt < max_attempts:
                # Calculate sleep delay: initial_interval * (backoff_coeff ^ (attempt - 1))
                delay = initial_interval * (backoff_coeff ** (attempt - 1))
                logger.info(f"Sleeping for {delay:.2f} seconds before retrying...")
                time.sleep(delay)

    action_name = getattr(action, "__name__", str(action))
    logger.error(f"All {max_attempts} retry attempts failed for action '{action_name}'. routing to DLQ.")
    raise MaxRetriesExceededException(
        f"Failed to execute action after {max_attempts} attempts."
    ) from last_exception
