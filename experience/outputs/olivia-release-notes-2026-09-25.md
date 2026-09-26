# Olivia Arcana — 25 September 2026

The homepage uses the selected **Light Leaks / card-palette** animation. Its card paths, camera, artwork and 96-second playback are preserved. “Watch the journey” plays on the homepage; pause and replay stay there. The original source remains in `olivia-approved-motion-2026-09-24.html` with SHA-256 `100608f7d72a8e94f021983b47ab4d601ef1e3ee4fe6b1a697685380de0a2a12`.

The homepage now contains real server-rendered content rather than an iframe. Ukrainian has its own homepage, card library and all 78 card pages, with localized card meanings, reversals, reading controls, canonical links and sitemap entries. The product also includes optional saved reversal orientations, an explicit question-interpretation request, and an optional daily calendar reminder download.

Validation: 73 product checks and 16 website/API checks passed; production build completed. Reference wave and Moon frames, inline playback, pause/replay, mobile layout and reduced motion were checked in a browser. The hosted preview had no console errors.

Remaining service work: AI credentials are configured, but actual English and Ukrainian provider calls fail with `502 provider_unavailable`; the exact upstream rejection reason is unknown. No canned response is substituted. Account/payment services need restoration before selling membership. Calendar reminders require the user to import the file and enable reminders; browser push is not implemented. No shop was added and Telegram remains unverified. The Ukrainian page content is localized; the outer server document still starts with `lang=en`, with the Ukrainian content marked `lang=uk` and the runtime setting the document language.

Deployment IDs and the exact published asset versions are recorded in `olivia-native-release-2026-09-25.json`.
