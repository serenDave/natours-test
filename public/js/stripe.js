/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

let stripe;

if (Stripe) {
    stripe = Stripe(
        'pk_test_51HEqsnExaZxctD1wW0koeI1sUT1FaZMaBigYs2FZOjMD5tTDIrUf94ORRfw7PI7oXLexPM6qYmtsPXh4XrzHgXbN00nNqpFjwt',
    );
}

export const bookTour = async tourId => {
    try {
        // 1) Get the session from the server
        const session = await axios.get(`/api/v1/bookings/checkout-session/${tourId}`, {
            withCredentials: true
        });
        console.log(session);
    
        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
        
    } catch (err) {
        console.log(err);
        showAlert('error', err.response.data.message);
    }
};