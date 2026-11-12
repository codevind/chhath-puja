# Connect admin entries to the existing sheet

The published CSV URL is read-only. The admin interface needs this Apps Script deployment before login and saving can work. No password belongs in frontend config.

1. Open the original Google spreadsheet that supplies the contributors list, then **Extensions > Apps Script**. Copy `google-apps-script/Admin.gs` into the script editor.
2. Ensure row 1 of the existing tab contains these unique column headers (in any order): **Receipt ID, Name, Date, Time, Amount, Status**. Preserve existing data and add Status if needed. The script maps by header rather than column position.
3. In Apps Script **Project Settings > Script Properties**, set:
   - `ADMIN_USER_ID`: your chosen admin user ID.
   - `ADMIN_PASSWORD`: a strong, unique password.
   - `SPREADSHEET_ID`: the ID from the original spreadsheet's `/spreadsheets/d/ID/edit` URL. The published `2PACX...` ID is not this ID.
   - `SHEET_GID`: the tab ID; the current CSV uses `0`.
4. Select **Deploy > New deployment > Web app**, execute as **Me**, access **Anyone**, and authorize access as the sheet owner. The script verifies credentials and sessions before allowing writes.
5. Copy the deployed URL ending in `/exec` into `adminApiUrl` in `src/config.ts`. Rebuild the website. Use a new deployment version after changing script code.
6. Open Admin Section. Verify incorrect credentials are rejected, then log in and submit a test entry. Check the SAME sheet for its name, numeric amount, status, generated `CPS-...` receipt ID, and submission date/time in Asia/Kolkata. Refresh Contributors after Google's published CSV cache updates.

Sessions are saved in this browser's local storage and in Apps Script properties until explicit logout. Closing the popup or refreshing the page keeps the admin signed in. Use the header admin icon to reopen the form and Logout to revoke the server session and clear the browser token. Clearing browser storage also removes the local login. To revoke a session manually, delete its `session:` property in Apps Script.

After updating from the previous one-hour session implementation, paste the updated Admin.gs and use **Deploy > Manage deployments > Edit > New version > Deploy**, keeping the same web-app URL. Log in again once after this upgrade. Login attempts are limited globally to 30 per rolling 15-minute idle window. If a save response is lost, retry the unchanged entry without closing the popup: its submission ID is reused to prevent duplicate rows. Do not change entry details while retrying an uncertain save. A confirmed save starts a new submission ID.

Contributors has Success, Pending, and Under Verification tabs. Only `done` rows appear in Success, count toward the successful contributions total, and offer receipts. Verify rows appear in Under Verification. Every other status (including blank) appears in Pending. Logged-in admins can edit pending and under-verification entries using the pencil icon; Name, Amount, and Status are prefilled and editable. Updates use the existing Receipt ID to change the same sheet row and preserve its original Date and Time. Changing status to `done` moves the entry into Success. Confirmed changes appear locally immediately while the published CSV catches up. Status is recorded as entered by the admin; it does not verify a payment.

For edit support, paste the latest Admin.gs into Apps Script and deploy a **New version** using **Deploy > Manage deployments > Edit**, preserving the existing URL. The frontend alone cannot enable sheet updates on an older script deployment.

Reference: https://developers.google.com/apps-script/guides/web

## Site visit counter

The footer records one visit per page load (refresh counts again; navigation inside the portal does not). As requested, the displayed count is 100 times recorded visits; it is not a count of unique visitors. The actual load count is persisted in the `SITE_VISITS` Script Property, separate from contribution rows. The `visit` action is public, and retry IDs are deduplicated for up to six hours using Apps Script cache. Deploy the latest script as a new version to enable it. No initial property setup is needed.

## Admin payment mode

Admin Status offers only Done and Pending. Verify is assigned automatically only by the public donation Proceed action, and cannot be explicitly selected or assigned through admin create/update requests. Editing an Under Verification entry requires selecting Done or Pending before saving.

Admin create and edit forms include Payment mode: Cash or Online (Cash by default for new admin entries). Online displays a UPI QR using the current form amount, and changing the amount updates the QR. A positive amount with up to two decimal places is required to show it. Selecting a mode or scanning does not write an entry; Submit creates it, and Update contribution edits the existing row. The selected status remains under admin control.

Deploy the latest Admin.gs as a new version. The script automatically adds a **Mode** column when needed and records Cash or Online. Public donation entries are recorded as Online. Older entries may have blank mode until an admin selects one and saves.

## Public donation flow

Donate opens a form containing Name, optional Mobile Number, and Amount, without admin login. Proceed saves the entry before showing the payment options, using the public `donate` action. The server forces status to **Verify**, generates the receipt reference from the submission UUID, and records the entry timestamp in India time. Public requests cannot create a `done` entry or update existing entries. Retries of the same submission reuse its ID. A basic global limit allows 100 new public entries per five-minute idle window; this is an availability guard, not bot verification.

Mobile Number is optional in both public and admin forms, including admin edits. Accepts 10 digits with optional +91 prefix; spaces, parentheses, and hyphens are removed. The updated script automatically adds a **Mobile Number** column if missing and stores numbers as text. Existing rows can have blank mobile numbers. Redeploy the latest Admin.gs as a new version to enable saving mobile numbers.

Mobile numbers are not shown in the contributors table or receipts, but the current published CSV exposes all columns of the published tab, including Mobile Number. Keeping contact details private requires replacing that CSV with an endpoint or separate public sheet containing only approved public fields.

The payment screen displays the submitted amount. Both the UPI link and QR contain `am` (two decimal places), `cu=INR`, and a transaction reference. No minimum-amount parameter is sent. The portal displays a fixed amount on this screen, but cannot enforce how every external UPI app handles it or verify that a payment took place. Test on the actual phones/apps used by donors. Enforced payment amounts and automatic confirmation require a payment provider or bank integration with server-side verification.

Verify entries appear under Under Verification, offer no receipts, and do not count toward successful totals. An admin can edit them and mark them Done after checking the payment. Deploy the updated Admin.gs as a **New version** before using the new public donation flow, preserving the `/exec` URL and Script Properties.
