# Deploy the daily admin review reminder

GitHub Actions triggers the existing Render web service every day at **9:07 a.m. Malaysia time**. Render checks the same content as the dashboard’s Maintenance section and uses Brevo to send one summary to enabled admin accounts when items are due. The deployment uses the existing web service and database.

## 1. Configure Brevo on Render

1. In the team’s Brevo account, verify the approved RCBC sender address and authenticate its domain. Under **Settings → SMTP & API → API Keys & MCP**, generate an API key if the service still needs one. [Brevo sender setup](https://developers.brevo.com/docs/getting-started-with-senders-and-domains) · [Brevo API keys](https://help.brevo.com/hc/en-us/articles/40159485019794-Create-and-manage-your-API-keys)
2. Open **Render → your existing Dementia Care Hub web service → Environment**. Add or confirm the following settings and save them. [Render environment settings](https://render.com/docs/configure-environment-variables)

   | Variable | Value |
   | --- | --- |
   | `BREVO_API_KEY` | The Brevo API key. Enter it directly in Render. |
   | `BREVO_SENDER_EMAIL` | The exact verified RCBC sender address |
   | `BREVO_SENDER_NAME` | `RCBC Dementia Care` |
   | `BREVO_LIST_ID` | The numeric Brevo **Get Updated** contact list ID for subscriber sync |
   | `APP_BASE_URL` | The live website origin, such as `https://your-service.onrender.com` |
   | `REVIEW_REMINDER_ENABLED` | `false` for the preview |

   Review reminder recipients come from the site’s enabled admin accounts. For the full subscriber integration, including contact attributes and the verification command, see the [Get Updated setup guide](GET_UPDATED_EMAIL_SETUP.md).

   To enable **Get Updated** event emails after testing, set `REMINDERS_ENABLED=true` on the same Render service. The default sends a 21-day invite and a 72-hour final reminder for confirmed participants. Set `REMINDER_LAST_CALL_ENABLED=true` only if you also want the optional registration last call. [Event email setup](GET_UPDATED_EMAIL_SETUP.md#automatic-reminder-rules)

## 2. Connect GitHub Actions after the PR is merged

1. Generate a random secret in a private terminal and copy the output. The deployment lead can generate it and enter it directly in Render and GitHub. If another team member generates it, share it through a password manager or another secure channel. This shared secret lets Render verify that the reminder request comes from your GitHub Actions workflow.

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

2. Add it as `REVIEW_REMINDER_SECRET` in **Render → web service → Environment**.
3. In **GitHub → repository Settings → Secrets and variables → Actions**, add these values. [GitHub Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)

   | GitHub tab | Name | Value |
   | --- | --- | --- |
   | **Secrets** | `REVIEW_REMINDER_SECRET` | The exact same secret you entered in Render |
   | **Variables** | `REVIEW_REMINDER_URL` | The same live HTTPS website origin as `APP_BASE_URL` |

4. Deploy the merged commit on Render. If automatic deploys are off, select **Manual Deploy → Deploy latest commit**. With the existing production database settings, run the website and subscriber migrations before starting the server. If your deployment runs migrations in its start command, use `npm run db:migrate && npm run db:migrate:subscribers && npm run server`.

## 3. Preview, then enable delivery

1. On GitHub, open **Actions → Daily content review reminder → Run workflow**. Select the default branch and leave **mode** set to **preview**.
2. In Render’s service logs, look for **Review reminder preview** and confirm the summary lists each item’s title, type and due date. Items flagged for review without a due date show **No due date set**. The dashboard link should point to your live site’s `/admin`. If all content is current, GitHub reports `nothing-due`. Preview works before Brevo is ready.
3. Once the preview and admin accounts are verified, set `REVIEW_REMINDER_ENABLED=true` in Render and redeploy. Wait for the next scheduled run or use **Run workflow → live** to run it immediately. A live run sends to all enabled admin accounts if content is due.
4. If GitHub reports `sent`, verify the message in Brevo’s transactional logs and an admin inbox. A second successful trigger on the same Malaysia calendar day reports `already-sent` while there is still due content. To stop the email, set `REVIEW_REMINDER_ENABLED=false` in Render and redeploy.

If the Render logs report `delivery-pending`, check Brevo’s transactional logs for that day’s summary before attempting to recover the send. The database keeps the claim when delivery is uncertain to prevent duplicate emails.

GitHub schedules the workflow at `01:07 UTC`. Scheduled runs can start late, and GitHub can disable schedules after 60 days without activity in a public repository. [GitHub scheduling](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## Costs after handover

The reminder can run at no extra cost after handover if it stays within the included allowances.

- **Render.** The workflow calls the existing web service, so there is no separate Render Cron Job fee. Existing hosting and database charges still apply.
- **GitHub Actions.** Standard GitHub-hosted runners are free for public repositories. For a private repository, the daily workflow uses the repository owner’s included Actions allowance. Usage beyond that allowance can incur charges. [GitHub Actions billing](https://docs.github.com/en/actions/concepts/billing-and-usage)
- **Brevo.** The Free plan includes 300 email sends per day, shared with the site’s other emails. A summary sent to five admins uses five sends. [Brevo plans](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans)

## Local testing

- **Console preview.** Set `DATABASE_URL` and `APP_BASE_URL` in the gitignored `.env`, then run `npm run review-reminders:preview`. This prints the summary without contacting Brevo or requiring `REVIEW_REMINDER_SECRET`.
- **HTTP preview.** To test the endpoint locally, generate a separate secret using the command above and set it as `REVIEW_REMINDER_SECRET` in your local `.env`. Restart the server and send a `POST` to `/api/admin/review-reminder?mode=preview` with the same local secret in the `Authorization: Bearer <secret>` header. The preview prints to the server console without sending email.
