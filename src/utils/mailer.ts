import nodemailer from 'nodemailer'

export default async function sendResetEmail (to: string, resetLink: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  })

  await transporter.sendMail({
    from: `"MentorLink" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Reset Your Password',
    html: `
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 15 minutes.</p>
    `
  })
  return
}
