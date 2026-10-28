import time

_in_memory_rate_cache = {}

def _check_in_memory_rate(key_id: str) -> int:
    current_minute = int(time.time() // 60)
    if len(_in_memory_rate_cache) > 1000:
        expired = [k for k, (wm, _) in _in_memory_rate_cache.items() if wm < current_minute]
        for k in expired:
            _in_memory_rate_cache.pop(k, None)

    window_minute, count = _in_memory_rate_cache.get(key_id, (current_minute, 0))
    if window_minute != current_minute:
        count = 0
        window_minute = current_minute
    count += 1
    _in_memory_rate_cache[key_id] = (window_minute, count)
    return count

# Test counting
key = "test_key_1"
assert _check_in_memory_rate(key) == 1
assert _check_in_memory_rate(key) == 2
assert _check_in_memory_rate(key) == 3

# Test independent keys
key2 = "test_key_2"
assert _check_in_memory_rate(key2) == 1

print("All in-memory rate limiter self-checks passed!")
