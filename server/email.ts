import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'akshadapastambh37@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'urxpqhiqtjuhmcrs'
  }
});

export async function sendWelcomeEmail(email: string, password: string, firstName: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'akshadapastambh37@gmail.com',
    to: email,
    subject: 'Welcome to GameDev Project Manager',
    html: `
      <h2>Welcome to GameDev Project Manager!</h2>
      <p>Hello ${firstName},</p>
      <p>Your account has been created successfully. Here are your login credentials:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
      </div>
      <p>Please log in and change your password as soon as possible.</p>
      <p>You can access the system at: <a href="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app` : 'your-domain.com'}">GameDev Project Manager</a></p>
      <p>Best regards,<br>GameDev Project Manager Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service verification failed:', error);
    return false;
  }
}