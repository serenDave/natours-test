/* eslint-disable */

export const showAlert = (type, message) => {
    hideAlert();
    
    const markup = `<div class="alert alert--${type}">${message}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

    setTimeout(() => {
        hideAlert();
    }, 5000);
};

const hideAlert = () => {
    const alertElement = document.querySelector('.alert');
    if (alertElement) alertElement.parentElement.removeChild(alertElement);
};