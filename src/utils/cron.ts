import cron from "node-cron";
import { sendReminderEmail } from "./mailer";
import { pool } from "../config/db.config";

// Run every day at 7 AM server time
cron.schedule("0 7 * * *", async () => {
  console.log("Running session reminder job...");

  const query = `
    SELECT 
      sb.date, sb.start_time,
      mentor.email AS mentor_email,
      mentee.email AS mentee_email,
      mentor.username AS mentor_name,
      mentee.username AS mentee_name
    FROM session_bookings sb
    JOIN mentors m ON m.id = sb."mentorId"
    JOIN users mentor ON mentor.id = m."userId"
    JOIN mentees me ON me.id = sb."menteeId"
    JOIN users mentee ON mentee.id = me."userId"
    WHERE sb.date = CURRENT_DATE + INTERVAL '1 day' AND sb.status = 'booked';
  `;

  try {
    const { rows } = await pool.query(query);
    for (const session of rows) {
      const {
        date,
        start_time,
        mentor_email,
        mentee_email,
        mentor_name,
        mentee_name,
      } = session;

      const formattedTime = `${date} at ${start_time}`;

      const html = (recipient: string, otherParty: string) => `
        <div style="font-family: sans-serif">
          <h3>Hello ${recipient},</h3>
          <p>This is a reminder that you have a mentorship session with <strong>${otherParty}</strong> scheduled for <strong>${formattedTime}</strong>.</p>
          <p>Please be prepared and join on time.</p>
          <br/>
          <p>Mentorship Platform</p>
        </div>
      `;

      await sendReminderEmail(
        mentor_email,
        "Mentorship Session Reminder",
        html(mentor_name, mentee_name)
      );

      await sendReminderEmail(
        mentee_email,
        "Mentorship Session Reminder",
        html(mentee_name, mentor_name)
      );
    }

    console.log(`Reminders sent: ${rows.length}`);
  } catch (err) {
    console.error("Reminder Job Error:", err);
  }
});
