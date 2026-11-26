import pytest
import os
import sys
import asyncio
import jsonschema

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas.extract import SchemaExtractRequest, SchemaExtractResponse
from app.services.schema_extract_service import (
    extract_with_schema,
    _heuristic_fallback_extraction,
    _attempt_soft_coercion
)

SAMPLE_PRODUCT_HTML = """
<!DOCTYPE html>
<html>
<head><title>Cloudflare Workers Pricing</title></head>
<body>
    <header><h1>Cloudflare Workers Serverless Compute</h1></header>
    <main>
        <p>Run serverless code instantly across the globe with exceptional performance.</p>
        <div class="pricing-card">
            <h2>Paid Plan</h2>
            <p class="price">monthly_price: 5.00</p>
            <p>included_requests: 10000000</p>
            <p>cpu_limit_ms: 50</p>
            <p>has_durable_objects: true</p>
        </div>
    </main>
</body>
</html>
"""

PRODUCT_SCHEMA = {
    "type": "object",
    "properties": {
        "monthly_price": {"type": "number"},
        "included_requests": {"type": "integer"},
        "cpu_limit_ms": {"type": "integer"},
        "has_durable_objects": {"type": "boolean"}
    },
    "required": ["monthly_price", "included_requests"]
}

def test_schema_request_models():
    req = SchemaExtractRequest(
        url="https://example.com/pricing",
        schema=PRODUCT_SCHEMA,
        temperature=0.0
    )
    assert req.url == "https://example.com/pricing"
    assert req.schema_definition == PRODUCT_SCHEMA
    assert req.temperature == 0.0

    resp = SchemaExtractResponse(
        url=req.url,
        data={"monthly_price": 5.0, "included_requests": 10000000},
        validation_status="valid",
        execution_time_ms=120,
        tokens_used=150
    )
    assert resp.data["monthly_price"] == 5.0
    assert resp.validation_status == "valid"

def test_heuristic_fallback_extraction():
    data = _heuristic_fallback_extraction(SAMPLE_PRODUCT_HTML, PRODUCT_SCHEMA)
    assert "monthly_price" in data
    assert data["monthly_price"] == 5.0
    assert data["included_requests"] == 10000000
    assert data["has_durable_objects"] is True

def test_soft_type_coercion():
    dirty_data = {
        "monthly_price": "$29.99",
        "included_requests": "50,000",
        "has_durable_objects": "yes"
    }
    coerced = _attempt_soft_coercion(dirty_data, PRODUCT_SCHEMA)
    assert isinstance(coerced["monthly_price"], float)
    assert coerced["monthly_price"] == 29.99
    assert isinstance(coerced["included_requests"], int)
    assert coerced["included_requests"] == 50000
    assert coerced["has_durable_objects"] is True

def test_jsonschema_validation_and_reporting():
    valid_data = {
        "monthly_price": 5.0,
        "included_requests": 10000000,
        "cpu_limit_ms": 50,
        "has_durable_objects": True
    }
    # Should not raise exception
    jsonschema.validate(instance=valid_data, schema=PRODUCT_SCHEMA)

    invalid_data = {
        "monthly_price": "not-a-number",
        "included_requests": "many"
    }
    with pytest.raises(jsonschema.exceptions.ValidationError):
        jsonschema.validate(instance=invalid_data, schema=PRODUCT_SCHEMA)

def test_end_to_end_schema_extraction_service():
    req = SchemaExtractRequest(
        html=SAMPLE_PRODUCT_HTML,
        schema=PRODUCT_SCHEMA
    )
    from unittest.mock import AsyncMock, patch
    from app.config import settings

    mock_llm_result = (
        {
            "monthly_price": 5.0,
            "included_requests": 10000000,
            "cpu_limit_ms": 50,
            "has_durable_objects": True
        },
        128
    )

    with patch("app.services.schema_extract_service.get_cached", new=AsyncMock(return_value=None)):
        with patch("app.services.schema_extract_service.set_cached", new=AsyncMock(return_value=None)):
            with patch("app.services.schema_extract_service.call_extraction_llm", new=AsyncMock(return_value=mock_llm_result)):
                with patch.object(settings, "LLM_API_KEY", "mock_key"):
                    response = asyncio.run(extract_with_schema(req))

    assert response.data is not None
    assert response.data["monthly_price"] == 5.0
    assert response.data["included_requests"] == 10000000
    assert response.validation_status == "valid"
    assert response.tokens_used == 128

if __name__ == "__main__":
    print("Running schema extraction tests directly...", flush=True)
    test_schema_request_models()
    print("PASS: test_schema_request_models", flush=True)
    test_heuristic_fallback_extraction()
    print("PASS: test_heuristic_fallback_extraction", flush=True)
    test_soft_type_coercion()
    print("PASS: test_soft_type_coercion", flush=True)
    test_jsonschema_validation_and_reporting()
    print("PASS: test_jsonschema_validation_and_reporting", flush=True)
    print("Running test_end_to_end_schema_extraction_service...", flush=True)
    test_end_to_end_schema_extraction_service()
    print("PASS: test_end_to_end_schema_extraction_service", flush=True)
    print("ALL 5 SCHEMA EXTRACTION TESTS PASSED!", flush=True)
