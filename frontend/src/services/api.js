const API_BASE = '/api';

export async function fetchNetwork() {
  const res = await fetch(`${API_BASE}/network`);
  if (!res.ok) throw new Error(`Failed to load network: ${res.statusText}`);
  return res.json();
}

export async function calculateReroute(source = 101, target = 107, blockedEdgeIds = []) {
  const res = await fetch(`${API_BASE}/reroute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source,
      target,
      blocked_edge_ids: blockedEdgeIds
    })
  });
  if (!res.ok) throw new Error(`Reroute calculation failed: ${res.statusText}`);
  return res.json();
}

export async function synthesizeSchedule(maintenanceRequests = null, blockedEdgeIds = []) {
  const res = await fetch(`${API_BASE}/synthesize-schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maintenanceRequests,
      blockedEdgeIds
    })
  });
  if (!res.ok) throw new Error(`Synthesize schedule failed: ${res.statusText}`);
  return res.json();
}

export async function fetchFleetSchedule() {
  const res = await fetch(`${API_BASE}/fleet-schedule`);
  if (!res.ok) throw new Error(`Fetch fleet schedule failed: ${res.statusText}`);
  return res.json();
}

export async function toggleEdgeBlock(edgeId, isBlocked) {
  const res = await fetch(`${API_BASE}/toggle-block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ edgeId, isBlocked })
  });
  if (!res.ok) throw new Error(`Toggle block failed: ${res.statusText}`);
  return res.json();
}

export async function resetNetwork() {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Reset failed: ${res.statusText}`);
  return res.json();
}

export async function fetchCacheStats() {
  const res = await fetch(`${API_BASE}/cache-stats`);
  if (!res.ok) throw new Error(`Cache stats failed: ${res.statusText}`);
  return res.json();
}

export async function clearCache() {
  const res = await fetch(`${API_BASE}/cache-clear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Clear cache failed: ${res.statusText}`);
  return res.json();
}

export async function applyMaintenanceScenario(maintenanceId) {
  const res = await fetch(`${API_BASE}/apply-maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ maintenanceId })
  });
  if (!res.ok) throw new Error(`Apply maintenance failed: ${res.statusText}`);
  return res.json();
}

export async function switchDataset(dataset = 'real_ir') {
  const res = await fetch(`${API_BASE}/switch-dataset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset })
  });
  if (!res.ok) throw new Error(`Switch dataset failed: ${res.statusText}`);
  return res.json();
}

export async function fetchMaintenanceIntelligence() {
  const res = await fetch(`${API_BASE}/maintenance-intelligence`);
  if (!res.ok) throw new Error(`Fetch maintenance intelligence failed: ${res.statusText}`);
  return res.json();
}

export async function optimizeBacklog() {
  const res = await fetch(`${API_BASE}/optimize-backlog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Optimize backlog failed: ${res.statusText}`);
  return res.json();
}

