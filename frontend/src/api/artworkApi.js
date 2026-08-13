import api from './axiosInstance';

// All calls go through the shared axios instance (JWT header + refresh
// already wired up there) — nothing new to configure.

export const createArtworkRequest = (payload) =>
  api.post('/api/artwork/create/', payload);

export const listArtworkRequests = (params = {}) =>
  api.get('/api/artwork/list/', { params });

export const getArtworkDetails = (artworkId) =>
  api.get(`/api/artwork/${artworkId}/`);

export const uploadArtworkVersion = (artworkId, file, changeSummary = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (changeSummary) formData.append('change_summary', changeSummary);
  return api.post(`/api/artwork/${artworkId}/upload-version/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const actOnArtworkApproval = (artworkId, decision, comments = '') =>
  api.post(`/api/artwork/${artworkId}/act-approval/`, { decision, comments });

export const releaseArtwork = (artworkId) =>
  api.post(`/api/artwork/${artworkId}/release/`);

export const archiveArtwork = (artworkId) =>
  api.post(`/api/artwork/${artworkId}/archive/`);

export const getArtworkComments = (artworkId) =>
  api.get(`/api/artwork/${artworkId}/comments/`);

export const addArtworkComment = (artworkId, message) =>
  api.post(`/api/artwork/${artworkId}/comments/add/`, { message });