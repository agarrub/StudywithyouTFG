import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs/promises';
import juice from 'juice';

config({ path: path.join(import.meta.dirname, '../../.env') });


const transporter = nodemailer.createTransport(
  {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  }
);

export async function sendEmail(to, subject, { templateName = 'errorEmail', eventName = 'Error en el evento', eventDate = '', eventTime = '', daysLeft = 0, link = '', user = '', } = {}) {

  const logo = "https://res.cloudinary.com/ddsevyesd/image/upload/v1778698510/Imagen2_aq3kvi.png";
  const calendar = "https://res.cloudinary.com/ddsevyesd/image/upload/v1778505926/calendar_znf56x.png";
  const clock = "https://res.cloudinary.com/ddsevyesd/image/upload/v1778698933/clock_gwokgn.png";


  try {
    let html = await fs.readFile(
      path.resolve(import.meta.dirname, `../emailTemplates/${templateName}.html`),
      'utf-8',
    );

    html = html.replaceAll('{eventName}', eventName);
    html = html.replaceAll('{eventDate}', eventDate);
    html = html.replaceAll('{eventTime}', eventTime);
    html = html.replaceAll('{daysLeft}', daysLeft);
    html = html.replaceAll('{link}', link);
    html = html.replaceAll('{user}', user);
    html = html.replaceAll('[LOGO]', logo);
    html = html.replaceAll('[CALENDAR_ICON]', calendar);
    html = html.replaceAll('[CLOCK_ICON]', clock);

    const htmlData = juice(html);

    transporter.sendMail({
      from: { name: "Studywithyou", address: process.env.NODEMAILER_USER },
      to: to,
      subject: subject,
      html: htmlData,
    });
  } catch (error) {
    console.log(error);
  }
};
