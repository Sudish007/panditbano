// Site root index.html (design.md §3.2): meta refresh to hi/ plus a 6-line script that honours the persisted
// pb-lang (hi | en | bho, anything else → hi). Canonical points at the Hindi home.
import { html, raw, t } from "../lib.mjs";

export const ROOT_SCRIPT = `<script>
(function(){var l=null;try{l=localStorage.getItem('pb-lang')}catch(e){}
if(l!=='hi'&&l!=='en'&&l!=='bho')l='hi';
location.replace(l+'/');
})();
</script>`;

export function rootRedirectPage(ctx) {
  const R = ctx.R;
  return html`<!DOCTYPE html>
<html lang="hi" dir="ltr" data-base="${R.BASE_PATH}" data-page="root-redirect">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t("hi", "site.name")} · ${t("en", "site.name")}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${R.abs("hi/")}">
<meta http-equiv="refresh" content="0; url=hi/">
${raw(ROOT_SCRIPT)}
</head>
<body>
<p lang="hi"><a href="hi/">${t("hi", "site.name")}</a> · <a href="en/" lang="en">${t("en", "site.name")}</a> · <a href="bho/" lang="bho">${t("bho", "site.name")}</a></p>
</body>
</html>
`;
}
