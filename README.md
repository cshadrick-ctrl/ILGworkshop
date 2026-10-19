# ILG Brand Strategy Workshop board

A single page plus three small API routes. No build step and no dependencies.

`index.html` has the pitch slides and logos built in, so it shows them however it's uploaded. The `api` folder needs to sit next to it for saving and Pull it together to work.

## Deploy to Vercel

1. Push this folder to a GitHub repo and import it in Vercel. Framework preset: **Other**. Leave the build command empty.
2. In the Vercel project, go to **Storage**, add **Upstash for Redis** from the Marketplace and connect it to the project. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you.
3. In **Settings > Environment Variables**, add:
   - `BOARD_PASSCODE`: the passcode people type to open the board. Set this. The notes are client-confidential and the site is otherwise public.
   - `ANTHROPIC_API_KEY`: switches on **Pull it together**.
   - `ANTHROPIC_MODEL` (optional): the Claude model for Pull it together. Defaults to `claude-opus-5-5`. Change it if your API key uses a different model.
4. Redeploy so the variables take effect.

## How saving works

- Every note saves to Redis about a second after you stop typing. The top bar shows "Saving", then "All saved" with the time.
- If a save fails, the bar says how many changes haven't saved. Tap it to retry. It also retries on its own once the connection is back.
- Everything is also kept in the browser, so a dropped connection loses nothing.
- **Save** (or Cmd+S) writes everything immediately.
- **Download backup** saves a Markdown file of the whole board, including the Pull it together result. **Restore from backup** on the All notes tab loads that file back in. It only adds notes and never removes any.
- The board checks for other people's notes every four seconds, so Penny can add notes from her laptop during the session.

## Dry runs

Add `?board=` and any name to the address, for example `your-site.vercel.app/?board=test`. That opens a separate, empty board with its own notes. The live session uses the address with nothing added.

## Without the setup

With no Redis connected, the board still runs and saves in that browser only. Download backup still works. Pull it together needs `ANTHROPIC_API_KEY`.
