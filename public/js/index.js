/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { updateSettings } from './updateUserData';
import { displayMap } from './mapbox';
import { bookTour } from './stripe';

// GETTING DOM ELEMENS
const mapBox = document.getElementById('map');
const form = document.querySelector('.form--login'); 
const logOutBtn = document.querySelector('.nav__el--logout');
const formData = document.querySelector('.form-user-data');
const formPassword = document.querySelector('.form-user-password');
const bookTourButton = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (form) {
    form.addEventListener('submit', e => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        e.preventDefault();
        login(email, password);
    });
}

if (logOutBtn) {
    logOutBtn.addEventListener('click', logout);
}

if (formData) {
    formData.addEventListener('submit', e => {
        e.preventDefault();

        // Creating form data programatically
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);

        updateSettings(form, 'data');
    });
}

if (formPassword) {
    formPassword.addEventListener('submit', async e => {
        e.preventDefault();

        const password = document.getElementById('password-current').value;
        const newPassword = document.getElementById('password').value;
        const newPasswordConfirm = document.getElementById('password-confirm').value;

        document.getElementById('password-save').textContent = 'Loading...'
        await updateSettings({ password, newPassword, newPasswordConfirm }, 'password');
        document.getElementById('password-save').textContent = 'Save password'

        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    });
}

if (bookTourButton) {
    bookTourButton.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
        bookTour(e.target.dataset.tour);
    });
}