/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    try {
        const res = await axios.post('/api/v1/users/login', {
            email,
            password
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Logged in successfully!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        } else throw new Error();
    } catch (error) {
        showAlert('error', error.response.data.message);
    }
};

export const logout = async () => {
    try {
        const res = await axios.get('/api/v1/users/logout');

        if (res.data.status = 'success') {
            if (location.pathname.includes('me')) {
                location.assign('/');
            } else {
                location.reload(true);
            }
        } 

    } catch (error) {
        showAlert('error', 'Error loggin out! Please, try again.');
    }
};