import formData from "form-data";
import Mailgun from "mailgun.js";
import { config } from "../config.js";

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: "api",
    key: config.mailgun.apiKey,
});

export const DOMAIN = config.mailgun.domain;

/** Sends a Mailgun message on the configured domain. */
export function sendMail(messageData) {
    return mg.messages.create(DOMAIN, messageData);
}
