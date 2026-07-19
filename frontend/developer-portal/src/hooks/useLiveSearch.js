import { useState, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export function useLiveSearch(apiBaseUrl, endpoint, token, apiKey) {
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
      'X-API-Key': apiKey || 'sm_live_YOUR_KEY',
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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
          const data = await response.json();
          throw new Error(data.detail || 'API request failed');
        }
        
        const data = await response.json();
        const taskId = data.task_id;
        
        setEvents(prev => [...prev, { event: 'info', data: { message: `Crawl job enqueued with Task ID: ${taskId}` } }]);
        
        // Step 2: Subscribe to SSE stream for this task
        await fetchEventSource(`${apiBaseUrl}/v1/crawl/${taskId}/stream`, {
          method: 'GET',
          headers: {
            'X-API-Key': headers['X-API-Key'],
            ...(token && { 'Authorization': headers['Authorization'] })
          },
          signal: abortControllerRef.current.signal,
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
  }, [apiBaseUrl, endpoint, token, apiKey, cancel]);

  return { loading, error, results, events, screenshots, latency, runPipeline, cancel, reset };
}
