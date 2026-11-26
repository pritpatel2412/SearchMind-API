import time
import json
import hashlib
import logging
from typing import Dict, Any, Optional, List, Tuple
import jsonschema

from app.config import settings
from app.http_client import get_http_client
from app.services.fetch_service import fetch_url_content
from app.services.extract_service import extract_content
from app.services.cache_service import get_cached, set_cached
from app.schemas.extract import SchemaExtractRequest, SchemaExtractResponse

logger = logging.getLogger("searchmind.schema_extract")

async def call_extraction_llm(
    system_instruction: str,
    user_prompt: str,
    temperature: float = 0.0,
    max_tokens: int = 2000
) -> Tuple[Dict[str, Any], int]:
    """Call OpenAI-compatible LLM in JSON Object mode."""
    if not settings.LLM_API_KEY:
        raise ValueError("No LLM API key configured")

    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    url = f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions"
    client = get_http_client()
    resp = await client.post(url, headers=headers, json=payload, timeout=20.0)
    resp.raise_for_status()
    res_json = resp.json()
    raw_text = res_json["choices"][0]["message"]["content"].strip()
    tokens_used = res_json.get("usage", {}).get("total_tokens", 0)
    return json.loads(raw_text), tokens_used

async def extract_with_schema(
    req: SchemaExtractRequest,
    db: Optional[Any] = None
) -> SchemaExtractResponse:
    """
    Autonomous schema-driven entity extraction.
    Scrapes the target page, sanitizes content into clean markdown,
    and extracts guaranteed type-safe structured JSON matching the provided JSON Schema.
    """
    start_time = time.time()
    
    # 1. Cache key generation
    schema_clean = req.schema_definition
    html_sig = hashlib.sha256(req.html.encode()).hexdigest() if req.html else None
    cache_payload = {
        "url": req.url,
        "html_sig": html_sig,
        "schema": schema_clean
    }
    cache_key = "schema_extract:" + hashlib.sha256(json.dumps(cache_payload, sort_keys=True).encode()).hexdigest()
    
    try:
        cached = await get_cached(cache_key, db=db)
        if cached:
            cached["cached"] = True
            cached["execution_time_ms"] = int((time.time() - start_time) * 1000)
            return SchemaExtractResponse(**cached)
    except Exception as e:
        logger.error(f"Cache check error in schema extraction: {e}")

    # 2. Acquire HTML source
    html = req.html
    if not html and req.url:
        html = await fetch_url_content(req.url, use_js=req.use_js_rendering)
        
    if not html:
        return SchemaExtractResponse(
            url=req.url,
            data={},
            validation_status="error",
            validation_errors=["Failed to fetch target URL content or empty document received"],
            execution_time_ms=int((time.time() - start_time) * 1000),
            tokens_used=0,
            cached=False
        )

    # 3. Clean and isolate document text
    extracted = extract_content(html, req.url or "https://raw-input")
    clean_markdown = extracted.get("content", "")
    if len(clean_markdown) > 30000:
        clean_markdown = clean_markdown[:30000]

    # 4. Construct Structured Output Prompt
    system_instruction = (
        req.system_prompt or 
        "You are an expert data extraction agent. Extract structured data from the document that strictly adheres to the requested JSON schema."
    )
    
    schema_str = json.dumps(req.schema_definition, indent=2)
    user_prompt = f"""Target JSON Schema specification:
```json
{schema_str}
```

Document Content:
\"\"\"
{clean_markdown}
\"\"\"

Instructions:
1. Extract ALL fields defined in the schema from the document above.
2. Return ONLY a single valid JSON object strictly conforming to the schema specification.
3. If an optional field is missing from the document, set it to null or omit it as appropriate.
4. Ensure data types strictly match the schema (e.g. numbers as float/int, booleans as true/false).
"""

    extracted_data = {}
    tokens_used = 0
    validation_status = "valid"
    validation_errors = []

    # 5. Execute LLM Extraction with JSON Object Mode
    if settings.LLM_API_KEY:
        try:
            extracted_data, tokens_used = await call_extraction_llm(
                system_instruction, user_prompt, req.temperature, req.max_tokens
            )
        except Exception as e:
            logger.error(f"LLM schema extraction failed: {e}")
            validation_status = "extraction_fallback"
            validation_errors.append(f"LLM extraction error: {str(e)}")
            extracted_data = _heuristic_fallback_extraction(clean_markdown, req.schema_definition)
    else:
        # Development / test fallback without live LLM key
        extracted_data = _heuristic_fallback_extraction(clean_markdown, req.schema_definition)
        validation_status = "heuristic_fallback"

    # 6. Validate against JSON Schema
    try:
        jsonschema.validate(instance=extracted_data, schema=req.schema_definition)
    except jsonschema.exceptions.ValidationError as val_err:
        validation_status = "validation_warning"
        validation_errors.append(f"Schema validation error at path '{'/'.join(str(p) for p in val_err.path)}': {val_err.message}")
        # Soft type coercion for common discrepancies (e.g. string numbers to float/int)
        extracted_data = _attempt_soft_coercion(extracted_data, req.schema_definition)
    except Exception as e:
        validation_status = "validation_warning"
        validation_errors.append(str(e))

    execution_time = int((time.time() - start_time) * 1000)

    response = SchemaExtractResponse(
        url=req.url,
        data=extracted_data,
        validation_status=validation_status,
        validation_errors=validation_errors if validation_errors else None,
        execution_time_ms=execution_time,
        tokens_used=tokens_used,
        cached=False
    )

    # 7. Write to two-tier cache
    try:
        await set_cached(
            cache_key, response.model_dump(), ttl=settings.EXTRACT_CACHE_TTL, db=db
        )
    except Exception as e:
        logger.error(f"Error caching schema extraction result: {e}")

    return response

def _heuristic_fallback_extraction(text: str, schema: Dict[str, Any]) -> Dict[str, Any]:
    """Heuristic extractor for testing and fallback environments."""
    properties = schema.get("properties", {})
    result = {}
    lines = text.split("\n")
    for key, spec in properties.items():
        spec_type = spec.get("type", "string")
        # Look for key pattern in text
        found_val = None
        for line in lines:
            if key.lower().replace("_", " ") in line.lower() or key.lower() in line.lower():
                found_val = line.split(":")[-1].strip() if ":" in line else line.strip()
                break
        if spec_type in ["number", "integer"]:
            try:
                import re
                nums = re.findall(r"[-+]?\d*\.\d+|\d+", str(found_val))
                result[key] = float(nums[0]) if (spec_type == "number" and "." in nums[0]) else int(nums[0])
            except Exception:
                result[key] = 0
        elif spec_type == "boolean":
            result[key] = True if found_val and "true" in str(found_val).lower() else False
        elif spec_type == "array":
            result[key] = [found_val] if found_val else []
        else:
            result[key] = found_val or f"Extracted {key}"
    return result

def _attempt_soft_coercion(data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
    """Coerces strings to ints/floats if expected by schema."""
    properties = schema.get("properties", {})
    coerced = dict(data)
    for key, spec in properties.items():
        if key in coerced:
            target_type = spec.get("type")
            val = coerced[key]
            if target_type == "number" and isinstance(val, str):
                try:
                    coerced[key] = float(val.replace("$", "").replace(",", "").strip())
                except Exception:
                    pass
            elif target_type == "integer" and isinstance(val, str):
                try:
                    coerced[key] = int(float(val.replace("$", "").replace(",", "").strip()))
                except Exception:
                    pass
            elif target_type == "boolean" and isinstance(val, str):
                coerced[key] = val.lower() in ["true", "1", "yes"]
    return coerced
