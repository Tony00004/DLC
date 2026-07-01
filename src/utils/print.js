export function printZone() {
  var el = document.getElementById("print-zone");
  if (!el) { alert("Aucun contenu à imprimer."); return; }
  var html = el.innerHTML;
  var w = window.open("", "_blank", "width=900,height=700");
  var css = [
    "@page { margin: 10mm 12mm; size: legal portrait; }",
    "body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #111; margin: 16px; padding: 0; }",
    "h2 { font-size: 15px; margin: 0 0 4px; }",
    "h3 { font-size: 12px; margin: 10px 0 4px; border-bottom: 1px solid #006c39; padding-bottom: 3px; color: #006c39; }",
    "h4 { font-size: 12px; margin: 8px 0 4px; color: #006c39; border-bottom: 1px solid #006c39; padding-bottom: 3px; }",
    "label { font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #777; display: block; margin-bottom: 1px; }",
    "input, select, textarea { border: none; border-bottom: 1px solid #ccc; padding: 1px 0; font-size: 11px; width: 100%; box-sizing: border-box; background: transparent; }",
    "textarea { min-height: 24px; resize: none; }",
    "table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }",
    "th { background: #04043C; color: white; padding: 5px 6px; text-align: left; font-size: 10px; }",
    "td { padding: 4px 6px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }",
    "tr:nth-child(even) td { background: #f5f7f5; }",
    "tfoot td { background: #e8f5ee !important; font-weight: bold; }",
    "a { color: #006c39; }",
    "button, .no-print { display: none !important; }",
    "div[style*='box-shadow'] { box-shadow: none !important; border: none !important; }",
    "body::after { content: 'Aucune demande papier ne sera accept\u00e9e.'; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 42px; font-weight: 900; color: rgba(0,0,0,0.04); white-space: nowrap; pointer-events: none; z-index: 9999; }"
  ].join(" ");
  var page = "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Impression DLC</title><style>" + css + "</style></head><body>" + html + "</body></html>";
  w.document.open();
  w.document.write(page);
  w.document.close();
  setTimeout(function() { w.focus(); w.print(); }, 500);
}
