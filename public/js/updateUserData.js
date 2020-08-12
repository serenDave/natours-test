/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
    try {
        const url = type === 'data' ? '/api/v1/users/update-me' : '/api/v1/users/update-password';
        const res = await axios.patch(url, data, { withCredentials: true });

        if (res.data.status === 'success') {
            showAlert('success', `${type[0].toUpperCase() + type.substr(1)} updated successfully`);
            window.setTimeout(() => {
                location.reload();
            }, 1500);
        }
    } catch (error) {
        showAlert('error', error.response.data.message);
    }
};
