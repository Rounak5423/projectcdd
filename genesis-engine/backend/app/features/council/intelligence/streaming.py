"""
CIVORA — Council Intelligence Response Streaming
Provides progressive speech delivery for advisor counsel while strictly isolating
presentation from authoritative state commits.
"""

import asyncio
from typing import AsyncGenerator, Optional
import logging

from app.features.council.intelligence.ai_cache import ai_cache
from app.features.council.intelligence.context import build_civilisation_context
from app.features.council.constants import SYSTEM_ADVISORS

logger = logging.getLogger(__name__)


async def stream_advisor_speech(
    advisor_id: str,
    world_id: str = "aurora-prime",
    words_per_chunk: int = 3,
    chunk_delay_sec: float = 0.02
) -> AsyncGenerator[str, None]:
    """
    Streams the formal speech of an advisor progressively to the client.
    Ensures safe presentation streaming without committing incomplete state.
    """
    from app.features.council.intelligence.orchestrator import CouncilOrchestrator
    orch = CouncilOrchestrator()

    # 1. Obtain validated result (from cache or evaluation)
    analysis = await orch.analyse_single_advisor_async(world_id=world_id, advisor_id=advisor_id)
    speech = analysis.briefing.get("formalSpeech", "")
    if not speech:
        advisor = next((a for a in SYSTEM_ADVISORS if a["id"] == advisor_id), None)
        title = advisor["title"] if advisor else "Advisor"
        speech = f"Sovereign Leader, {title} stands ready to advise the High Council."

    words = speech.split(" ")
    idx = 0
    total_words = len(words)

    try:
        while idx < total_words:
            chunk = " ".join(words[idx : idx + words_per_chunk])
            idx += words_per_chunk
            if idx < total_words:
                chunk += " "
            yield chunk
            if chunk_delay_sec > 0:
                await asyncio.sleep(chunk_delay_sec)
    except asyncio.CancelledError:
        logger.info(f"Speech stream for advisor '{advisor_id}' cancelled by client.")
        raise
