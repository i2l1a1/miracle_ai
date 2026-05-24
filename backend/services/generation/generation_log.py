import logging

logger = logging.getLogger("miracle.generation")


def log_pipeline_step(pipeline: str, step: int, step_name: str, content: str) -> None:
    text = content or ""
    logger.info(f"[{pipeline}] step={step} {step_name} output_len={len(text)}")
    logger.debug(f"[{pipeline}] step={step} {step_name} output={text}")
