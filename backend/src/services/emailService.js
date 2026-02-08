const nodemailer = require("nodemailer");
require('dotenv').config();
const logger = require("../config/logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "eijazkhan9099@gmail.com",
    pass: process.env.EMAIL_PASS || "lvlgwgtakhxocmcm"
  }
});



const getEmailTemplate = (subject, content, userInfo) => {
  return `
    <html>
      <body>
        <img 
          src="${process.env.COMPANY_LOGO_URL}" 
          alt="${process.env.COMPANY_NAME} Logo" 
          style="width:200px;"
        />

        <h1>${process.env.COMPANY_NAME}</h1>
        <h2>${subject}</h2>
        <p>${content}</p>

        <p>User Info:</p>
        <ul>
          ${Object.entries(userInfo)
            .map(([key, value]) => `<li>${key}: ${value}</li>`)
            .join("")}
        </ul>

        <p>
          Thank you,<br />
          ${process.env.COMPANY_NAME} Team
        </p>
      </body>
    </html>
  `;
};


const sendEmail = async (to,subject, content, userInfo) => {
  const html = getEmailTemplate(subject,content,userInfo);

  try{
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || (transporter && transporter.options && transporter.options.auth && transporter.options.auth.user) || 'no-reply@example.com',
      to,
      subject:`${process.env.COMPANY_NAME || 'District'} - ${subject}`,
      html
    });
    logger.info("email sent",{to,subject})
  }catch(err){
    logger.error("Email send failed",err);
    throw err;
  }
};

const sendOTP = async (to, otp, userInfo) => {
  const content = `Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.`;
  try {
    await sendEmail(to, "OTP Verification", content, userInfo);
  } catch (err) {
    logger.error("Email send failed, continuing without sending OTP", { to, err });
    logger.info("DEV OTP", { to, otp });
    // eslint-disable-next-line no-console
    console.warn(`DEV OTP for ${to}: ${otp}`);
  }
};

const sendWelcomeEmail = async (to, userInfo) => {
  const content = "Welcome to District! Your account is set up.";
  await sendEmail(to, "Welcome", content, userInfo);
};


const sendOrderConfirmation  = async (to,bookingDetails,userInfo) => {
  const content = `your booking is confirmed. Details seats: ${bookingDetails.seats}, Concert - ${bookingDetails.concertName}`;
  await sendEmail(to,"booking Confirmation",content,userInfo)
}
       

module.exports = { sendOTP, sendWelcomeEmail, sendOrderConfirmation };
