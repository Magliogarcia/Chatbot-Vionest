const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({ success: false, error: 'Respuesta inválida del servidor' }));

  if (!response.ok) {
    throw new Error(data.error || `Error HTTP ${response.status}`);
  }

  return data;
}

export const authApi = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request('/auth/me', {
      method: 'GET',
    }),

  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  createUser: (userData) =>
    request('/auth/create-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getUsers: () =>
    request('/auth/users', {
      method: 'GET',
    }),
};

export const chatApi = {
  sendMessage: (messageText, conversationId = null) =>
    request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ messageText, conversationId }),
    }),

  getConversations: () =>
    request('/chat/conversations', {
      method: 'GET',
    }),

  getConversation: (id) =>
    request(`/chat/conversations/${id}`, {
      method: 'GET',
    }),

  createConversation: (title) =>
    request('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  deleteConversation: (id) =>
    request(`/chat/conversations/${id}`, {
      method: 'DELETE',
    }),
};

export const systemApi = {
  getStatus: () =>
    request('/system/status', {
      method: 'GET',
    }),
};
