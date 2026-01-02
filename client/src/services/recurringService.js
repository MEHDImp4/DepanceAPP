import api from './api';

export const getRecurring = async () => {
    const response = await api.get('/recurring');
    return response.data;
};

export const createRecurring = async (data) => {
    const response = await api.post('/recurring', data);
    return response.data;
};

export const deleteRecurring = async (id) => {
    const response = await api.delete(`/recurring/${id}`);
    return response.data;
};

export const processRecurring = async () => {
    const response = await api.post('/recurring/process');
    return response.data;
};
