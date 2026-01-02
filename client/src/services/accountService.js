import api from './api';

export const getAccounts = async () => {
    const response = await api.get('/accounts');
    return response.data;
};
