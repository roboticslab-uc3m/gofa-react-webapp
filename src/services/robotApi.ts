const API_BASE_URL = 'http://localhost:3001/api';

export async function readDI1() {
  const response = await fetch(`${API_BASE_URL}/io/di1`);
  return response.json();
}

export async function turnOnDO1() {
  const response = await fetch(`${API_BASE_URL}/io/do1/on`, {
    method: 'POST',
  });
  return response.json();
}

export async function turnOffDO1() {
  const response = await fetch(`${API_BASE_URL}/io/do1/off`, {
    method: 'POST',
  });
  return response.json();
}

export async function motorsOn() {
  const response = await fetch(`${API_BASE_URL}/motors/on`, {
    method: 'POST',
  });
  return response.json();
}

export async function motorsOff() {
  const response = await fetch(`${API_BASE_URL}/motors/off`, {
    method: 'POST',
  });
  return response.json();
}

export async function setManualMode() {
  const response = await fetch(`${API_BASE_URL}/mode/manual`, {
    method: 'POST',
  });
  return response.json();
}

export async function setAutoMode() {
  const response = await fetch(`${API_BASE_URL}/mode/auto`, {
    method: 'POST',
  });
  return response.json();
}
