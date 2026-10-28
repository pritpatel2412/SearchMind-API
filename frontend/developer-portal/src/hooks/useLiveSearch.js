import { useState, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export function useLiveSearch(apiBaseUrl, endpoint, token, apiKey, onLogout) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [events, setEvents] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [latency, setLatency] = useState(0);
  
  const abortControllerRef = useRef(null);
  const startTimeRef = useRef(0);

  const reset = () => {
    setLoading(false);
    setError(null);
    setResults(null);
    setEvents([]);
    setScreenshots([]);
    setLatency(0);
  };

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setEvents(prev => [...prev, { event: "info", data: { message: "Pipeline cancelled by user." } }]);
    }
  }, []);

  const runPipeline = useCallback(async (payload, isCrawl = false) => {
    reset();
    setLoading(true);
    startTimeRef.current = Date.now();
    abortControllerRef.current = new AbortController();

    const headers = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const handleStreamOpen = async (response) => {
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('text/event-stream')) {
        return; // Valid SSE stream
      }

      let detailMsg = `Request failed (${response.status})`;
      try {
        const data = await response.json();
        if (typeof data.detail === 'string') {
          detailMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          detailMsg = data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join('; ');
        } else if (data.message) {
          detailMsg = data.message;
        } else if (data.error) {
          detailMsg = data.error;
        }
      } catch {
        try {
          const text = await response.text();
          if (text) detailMsg = text.slice(0, 300);
        } catch {}
      }

      if (response.status === 401) {
        if (onLogout) {
          onLogout();
        }
        throw new Error(`Session expired or unauthorized (${detailMsg}). Please log in again.`);
      }

      throw new Error(detailMsg);
    };

    try {
      if (isCrawl) {
        // Step 1: Enqueue crawl
        const response = await fetch(`${apiBaseUrl}${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal
        });
        
        if (!response.ok) {
          if (response.status === 401 && onLogout) {
            onLogout();
          }
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || `Crawl request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        const taskId = data.task_id;
        
        setEvents(prev => [...prev, { event: 'info', data: { message: `Crawl job enqueued with Task ID: ${taskId}` } }]);
        
        // Step 2: Subscribe to SSE stream for this task
        await fetchEventSource(`${apiBaseUrl}/v1/crawl/${taskId}/stream`, {
          method: 'GET',
          headers: {
            ...(apiKey && { 'X-API-Key': apiKey }),
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          signal: abortControllerRef.current.signal,
          onopen: handleStreamOpen,
          onmessage(msg) {
            if (msg.event === 'screenshot') {
              const data = JSON.parse(msg.data);
              setScreenshots(prev => [...prev, { url: data.url, b64: data.image_b64 }]);
            } else if (msg.event === 'complete') {
              setResults(JSON.parse(msg.data));
              setLatency(Date.now() - startTimeRef.current);
              setLoading(false);
            } else if (msg.event === 'error') {
              setError(JSON.parse(msg.data).message || 'Pipeline Error');
              setLoading(false);
            } else {
              setEvents(prev => [...prev, { event: msg.event, data: JSON.parse(msg.data) }]);
            }
          },
          onclose() {
            setLoading(false);
          },
          onerror(err) {
            throw err;
          }
        });

      } else {
        // Directly stream search/extract/research
        await fetchEventSource(`${apiBaseUrl}${endpoint}/stream`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
          onopen: handleStreamOpen,
          onmessage(msg) {
            if (msg.event === 'screenshot') {
              const data = JSON.parse(msg.data);
              setScreenshots(prev => [...prev, { url: data.url, b64: data.image_b64 }]);
            } else if (msg.event === 'complete') {
              setResults(JSON.parse(msg.data));
              setLatency(Date.now() - startTimeRef.current);
              setLoading(false);
            } else if (msg.event === 'error') {
              setError(JSON.parse(msg.data).message || 'Pipeline Error');
              setLoading(false);
            } else {
              setEvents(prev => [...prev, { event: msg.event, data: JSON.parse(msg.data) }]);
            }
          },
          onclose() {
            setLoading(false);
          },
          onerror(err) {
            throw err;
          }
        });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        setError(err.message || 'Pipeline returned exception.');
        setLoading(false);
      }
    }
  }, [apiBaseUrl, endpoint, token, apiKey, onLogout, cancel]);

  return { loading, error, results, events, screenshots, latency, runPipeline, cancel, reset };
}
