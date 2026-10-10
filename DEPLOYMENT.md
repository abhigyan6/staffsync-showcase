# Free Render showcase

Deploy the React build and Express API as one web service using the repository's `render.yaml` Blueprint. It explicitly selects the Free instance; do not select a paid plan.

1. Sign in to Render and connect your own fork or copy of this repository.
2. Create a Blueprint from this repository and the `main` branch.
3. Set `MONGODB_URI` privately in Render to your Atlas database connection string. Never put it in GitHub or frontend variables.
4. Set `CLIENT_ORIGIN` to the exact HTTPS service origin shown by Render, without a trailing slash. If the assigned URL differs from the initial value, update this variable and redeploy.
5. Add the service's outbound IP ranges from Render's Connect panel to Atlas Network Access. Avoid opening Atlas to all IP addresses.
6. Deploy and verify `/api/health` reports `ok` and `connected`, then check login, registration, and the three role workflows.

The configuration generates a JWT secret, uses secure cookies, binds to `0.0.0.0`, and lets Render supply the port. Production startup does not seed or reset Atlas records. Existing fictional accounts remain available through manual sign-in; the local demo shortcut cards are hidden in production.

## Showcase limitations

- The Free service sleeps after 15 minutes without incoming traffic and may take about a minute to wake up. Open it before presenting.
- Uploaded profile images currently use local files and will be lost after service restarts or redeploys. Persistent object storage remains a follow-up before relying on uploads in the hosted showcase.
- Registration intentionally lets anyone choose HR or Manager, matching the capstone requirements. Use fictional data only in this public demo.
- The project showcase is live at https://staffsync-demo.onrender.com. Deploying your own copy requires your own database credentials and environment configuration; this repository contains none of the showcase's private configuration.
