const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// new Email(user, url).sendWelcome()
// new Email(user, url).sendPasswordReset()

class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Davis test <${process.env.EMAIL_FROM}>`
    }

    createNewTransport() {
        // Create a transporter (service that will send the email)
        let serviceOptions = {};
        if (process.env.NODE_ENV === 'production') {
            // Sendgrid
            serviceOptions = {
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                },
            };
        } else  {
            serviceOptions = {
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            };
        }

        return nodemailer.createTransport(serviceOptions);
    }

    // Send the actual email
    async send(template, subject) {
        // 1) Render HTML based on the pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2) Define the email options
        const emailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        };

        // 3) Create a transport and send the email
        await this.createNewTransport().sendMail(emailOptions)
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the natours family!');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
    }
}

module.exports = Email;