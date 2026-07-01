import { getPrixTotal } from "./format";

export function exportExcel(filtered, filename) {
  var STATUTS = {
    soumise: "Soumise", acceptee: "Approuvée", validee: "Vérifiée",
    commandee: "En commande", partiellement_traitee: "Partiellement complétée", traitee: "Traitée / Complétée",
    refusee: "Refusée", annulee: "Annulée",
  };
  var CATS = {
    achat: "Demande d'achat de matériel",
    activite: "Demande d'activité et de sortie",
    requisition: "Demande de réquisition interne",
  };

  var headers = ["Numéro de la demande", "Catégorie", "Titre", "Demandeur", "Approbateur", "Statut", "Prix total"];
  var rows = filtered.map(function(r) {
    // Trouver le nom de l'approbateur dans l'historique
    var approbateur = "";
    if (r.history) {
      var entreeApprobation = r.history.find(function(h) { return h.status === "acceptee"; });
      if (entreeApprobation) approbateur = entreeApprobation.by;
    }
    return [
      r.requestNumber || String(r.id),
      CATS[r.type] || r.type,
      r.title,
      r.authorName,
      approbateur,
      STATUTS[r.status] || r.status,
      getPrixTotal(r),
    ];
  });

  // Générer un fichier HTML-Excel (format XLS) — 100% compatible accents
  function esc(val) {
    return String(val === null || val === undefined ? "" : val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var headerRow = headers.map(function(h) {
    return '<th style="background:#04043C;color:#fff;font-weight:bold;border:1px solid #ccc;padding:6px 10px;">' + esc(h) + '</th>';
  }).join("");

  var dataRows = rows.map(function(row, i) {
    var bg = i % 2 === 0 ? "#ffffff" : "#f5f5f5";
    var cells = row.map(function(cell) {
      return '<td style="border:1px solid #ccc;padding:5px 10px;background:' + bg + ';">' + esc(cell) + '</td>';
    }).join("");
    return "<tr>" + cells + "</tr>";
  }).join("");

  var html = '<?xml version="1.0" encoding="UTF-8"?>'
    + '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'
    + '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">'
    + '<head><meta charset="UTF-8"/>'
    + '<xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>'
    + '<x:Name>Demandes DLC</x:Name>'
    + '<x:WorksheetOptions><x:Selected/></x:WorksheetOptions>'
    + '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml>'
    + '</head><body>'
    + '<table border="1">'
    + '<thead><tr>' + headerRow + '</tr></thead>'
    + '<tbody>' + dataRows + '</tbody>'
    + '</table></body></html>';

  var blob = new Blob([html], { type: "application/vnd.ms-excel;charset=UTF-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename + ".xls";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
