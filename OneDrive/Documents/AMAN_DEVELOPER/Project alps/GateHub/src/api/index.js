// src/api/index.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://gatehub-backend.onrender.com/api';

const getToken = async () => await AsyncStorage.getItem('token');

const authHeader = async () => ({
  Authorization: `Bearer ${await getToken()}`,
});

export async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export async function apiLogin(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function apiRegister(name, email, password) {
  return apiRequest('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
}

export async function apiFetchSubjects(branch) {
  const query = branch && branch !== 'All'
    ? `?branch=${encodeURIComponent(branch)}` : '';
  const data = await apiRequest(`/subjects${query}`);
  return data.subjects;
}

export async function apiFetchFiles(subjectId) {
  const data = await apiRequest(`/files/${subjectId}`);
  return data.files;
}

export async function apiDeleteFile(fileId) {
  const headers = await authHeader();
  return apiRequest(`/files/${fileId}`, {
    method: 'DELETE',
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

export async function apiCreateSubject(subjectData) {
  const headers = await authHeader();
  return apiRequest('/subjects', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(subjectData),
  });
}

export async function apiEditSubject(subjectId, subjectData) {
  const headers = await authHeader();
  return apiRequest(`/subjects/${subjectId}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(subjectData),
  });
}

export async function apiDeleteSubject(subjectId) {
  const headers = await authHeader();
  return apiRequest(`/subjects/${subjectId}`, {
    method: 'DELETE',
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

export async function apiSaveLink(subjectId, name, url, size) {
  const headers = await authHeader();
  return apiRequest('/files/link', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subjectId, name, url,
      type: url.includes('drive.google.com') ? 'Google Drive' : 'External',
      size: size || 'Cloud Access',
    }),
  });
}