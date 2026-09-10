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

export const addArtworkComment = (artworkId, message, attachment = null, isInitialRemark = false) => {
  const formData = new FormData();
  if (message) formData.append('message', message);
  if (attachment) formData.append('attachment', attachment);
  if (isInitialRemark) formData.append('is_initial_remark', 'true');
  return api.post(`/api/artwork/${artworkId}/comments/add/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getProcurementList = () =>
  api.get('/api/artwork/procurement-team/');

export const createArtworkWithSpec = (payload) =>
  api.post('/api/artwork/create-with-spec/', payload);

export const getPackagingSpec = (artworkId) =>
  api.get(`/api/artwork/${artworkId}/spec/`);

export const assignProcurement = (artworkId, vendorId) =>
  api.post(`/api/artwork/${artworkId}/assign-procurement/`, { vendor_id: vendorId });


export const exportArtworkExcel = (artworkId) =>

  api.get(`/api/artwork/${artworkId}/export-excel/`, { responseType: 'blob' });

export const getPerformanceStats = () =>
  api.get('/api/artwork/performance-stats/');

export const getArtworkNotifications = () =>
  api.get('/api/artwork/notifications/');

export const markNotificationRead = (notificationId) =>
  api.post(`/api/artwork/notifications/${notificationId}/read/`);

export const markAllNotificationsRead = () =>
  api.post('/api/artwork/notifications/mark-all-read/');


export const actOnWorkflowStep = (artworkId, decision, comments = '') =>
  api.post(`/api/artwork/${artworkId}/act-workflow-step/`, { decision, comments });

export const generateMatcode = (artworkId) =>
  api.post(`/api/artwork/${artworkId}/generate-matcode/`);

export const sendPhysicalSample = (artworkId, { attachment, dateSent, estArrivalDate, comments }) => {
  const formData = new FormData();
  if (attachment) formData.append('attachment', attachment);
  if (dateSent) formData.append('date_sent', dateSent);
  if (estArrivalDate) formData.append('est_arrival_date', estArrivalDate);
  if (comments) formData.append('comments', comments);
  return api.post(`/api/artwork/${artworkId}/physical-sample/send/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const receivePhysicalSample = (artworkId) =>
  api.post(`/api/artwork/${artworkId}/physical-sample/receive/`);

// export const decidePhysicalSample = (artworkId, decision, comments = '') =>
//   api.post(`/api/artwork/${artworkId}/physical-sample/decide/`, { decision, comments });

export const decidePhysicalSample = (artworkId, decision, comments = '', rejectLevel = null) =>
  api.post(`/api/artwork/${artworkId}/physical-sample/decide/`, { decision, comments, reject_level: rejectLevel });


export const getLegalList = () =>
  api.get('/api/artwork/legal-team/');

export const getComplianceList = () =>
  api.get('/api/artwork/compliance-team/');

export const assignLegal = (artworkId, userId) =>
  api.post(`/api/artwork/${artworkId}/assign-legal/`, { user_id: userId });

export const assignCompliance = (artworkId, userId) =>
  api.post(`/api/artwork/${artworkId}/assign-compliance/`, { user_id: userId });


export const getLabList = () =>
  api.get('/api/artwork/lab-team/');


export const markSampleReceivedByMe = (artworkId) =>
  api.post(`/api/artwork/${artworkId}/physical-sample/mark-received-mine/`);