import { useState, useEffect } from "react";
import * as api from "./api";
import { COLORS, NIVEAUX, MATIERES } from "./constants";
import { S } from "./styles";
import { getSchoolYear } from "./utils/format";
import { cloneDefaultWorkflowConfig, getCreationStatus, isPendingForRole, isPendingC1, isPendingC2, isPendingC3 } from "./utils/workflow";
import { Topbar } from "./components/Topbar";
import { DemoBanner } from "./components/DemoBanner";
import { LoginScreen } from "./views/LoginScreen";
import { Dashboard } from "./views/Dashboard";
import { RequestDetail } from "./views/RequestDetail";
import { QueueView } from "./views/QueueView";
import { AdminView } from "./views/AdminView";
import { HistoryView } from "./views/HistoryView";
import { FormAchat } from "./forms/FormAchat";
import { FormActivite } from "./forms/FormActivite";
import { FormRequisition } from "./forms/FormRequisition";

export default function App() {
  // useEffect print style retiré — impression via printZone()
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [view, setView] = useState("dashboard");
  const [prevView, setPrevView] = useState("dashboard");
  const [serviceTypes, setServiceTypes] = useState(["Déplacement de mobilier", "Autres (précisez)"]);
  const [activeForms, setActiveForms] = useState({ achat: true, activite: true, requisition: true });
  const [approbateurRules, setApprobateurRules] = useState([
    { id: 1, approbateurId: 2, matieres: [], niveaux: ["Accueil","Année transitoire (AT)","S1","S2","S3","Soutien à l'apprentissage (SA)","Soutien à l'autonomie et la socialisation (SAS)"] },
    { id: 2, approbateurId: 8, matieres: [], niveaux: ["S4","S5","EMS","Pré-DÉP"] },
  ]);
  const [niveauxList, setNiveauxList] = useState([...NIVEAUX]);
  const [fournisseurList, setFournisseurList] = useState([
    "Amazon (NON AUTORISÉ)", "Canadian Tire", "Costco", "Dollarama", "IGA", "Intermarché",
    "Jean-Coutu", "Magi-Prix", "Maxi", "Métro", "Michaels", "Mieux enseigner", "Pharmaprix",
    "Rona", "Super C", "Walmart", "Autre (précisez)",
  ]);
  const [matieresList, setMatieresList] = useState([...MATIERES]);
  const [passionCategories, setPassionCategories] = useState([
    { name: "Arts",       subOptions: ["Art dramatique", "Musique", "Danse", "Multimédia"] },
    { name: "Action",     subOptions: ["Régulière", "Plein air"] },
    { name: "Découverte", subOptions: [] },
    { name: "Langue",     subOptions: [] },
  ]);
  const [workflowConfig, setWorkflowConfig] = useState(cloneDefaultWorkflowConfig());
  const [statusDefinitions, setStatusDefinitions] = useState({
    soumise:   "Demande envoyée à la direction répondante",
    acceptee:  "Demande acceptée par votre direction répondante et envoyée à la gestionnaire administrative",
    acceptee2: "Demande approuvée une première fois et en attente d'autorisation de l'Approbateur +",
    validee:   "Demande acceptée par la gestionnaire administrative et en attente d'être traitée par l'agent administratif",
    traitee:   "Demande terminée",
    commandee:             "Articles commandés — en attente de réception",
    partiellement_traitee: "Une partie des articles a été commandée ou reçue — la demande sera traitée à nouveau ultérieurement",
    refusee:   "Demande refusée par la direction ou la gestionnaire administrative",
    annulee:   "Demande annulée par le demandeur ou la demandeuse",
  });
  const [notificationConfig, setNotificationConfig] = useState({
    requester: { mode: "each_stage" },
    roles: {
      A:  { enabled: true, mode: "immediate", time1: "07:30", time2: "13:00" },
      A2: { enabled: true, mode: "immediate", time1: "07:30", time2: "13:00" },
      B:  { enabled: true, mode: "immediate", time1: "07:30", time2: "13:00" },
      C1: { enabled: true, mode: "immediate", time1: "07:30", time2: "13:00" },
      C2: { enabled: true, mode: "immediate", time1: "07:30", time2: "13:00" },
      C3: { enabled: true, mode: "immediate", time1: "07:30", time2: "13:00" },
    },
    templates: {
      requester: {
        subjectTemplate:  "DLC — {{titre}}",
        greetingTemplate: "Bonjour {{nom}},",
        introTemplate:    "La demande « {{titre}} » est maintenant : {{statut}}.",
        footerTemplate:   "Ce courriel est généré automatiquement par le système DLC. Pour ne plus recevoir ces notifications, contactez votre administrateur.",
      },
      approverImmediate: {
        subjectTemplate:  "DLC — {{titre}}",
        greetingTemplate: "Bonjour {{nom}},",
        introTemplate:    "Une demande nécessite votre attention : « {{titre}} » ({{role}}).",
        footerTemplate:   "Ce courriel est généré automatiquement par le système DLC. Pour ne plus recevoir ces notifications, contactez votre administrateur.",
      },
      approverDigest: {
        subjectTemplate:  "DLC — {{total}} demande(s) en attente · {{date}}",
        greetingTemplate: "Bonjour {{nom}},",
        introTemplate:    "Voici votre récapitulatif pour le {{date}}.",
        footerTemplate:   "Ce courriel est généré automatiquement par le système DLC. Pour ne plus recevoir ces notifications, contactez votre administrateur.",
      },
    },
  });
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editContext, setEditContext] = useState(null); // { request, nextStatus, comment }
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [usersData, settingsData, requestsData] = await Promise.all([
          api.getUsers(),
          api.getSettings(),
          api.getRequests(),
        ]);
        setAllUsers(usersData);
        setRequests(requestsData);
        if (settingsData.activeForms)         setActiveForms(settingsData.activeForms);
        if (settingsData.statusDefinitions)   setStatusDefinitions(settingsData.statusDefinitions);
        if (settingsData.approbateurRules)    setApprobateurRules(settingsData.approbateurRules);
        if (settingsData.niveauxList)         setNiveauxList(settingsData.niveauxList);
        if (settingsData.fournisseurList)     setFournisseurList(settingsData.fournisseurList);
        if (settingsData.passionCategories)   setPassionCategories(settingsData.passionCategories);
        if (settingsData.matieresList)        setMatieresList(settingsData.matieresList);
        if (settingsData.serviceTypes)        setServiceTypes(settingsData.serviceTypes);
        if (settingsData.calendarEvents)      setCalendarEvents(settingsData.calendarEvents);
        if (settingsData.workflowConfig)      setWorkflowConfig(settingsData.workflowConfig);
        if (settingsData.notificationConfig)  setNotificationConfig(settingsData.notificationConfig);
        if (settingsData.showDemoAccounts !== undefined) setShowDemoAccounts(settingsData.showDemoAccounts);
        setLoadError("");
      } catch (err) {
        setLoadError("Impossible de joindre le serveur DLC API (http://localhost:3001). Vérifiez qu'il est démarré, puis rechargez la page. Détail : " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSaveCalendarEvents(events) {
    try {
      await api.updateSetting("calendarEvents", events);
      setCalendarEvents(events);
    } catch (err) {
      alert("Erreur lors de la sauvegarde des événements du calendrier : " + err.message);
    }
  }

  async function handleLogin(email, password) {
    const u = await api.login(email, password);
    setUser(u);
    setView("dashboard");
  }

  function handleLogout() {
    setUser(null);
    setView("dashboard");
  }

  async function handleSubmitRequest({ type, title, formData }) {
    const today = new Date().toISOString().slice(0, 10);
    // Les demandes de réquisition interne vont directement au vérificateur (B)
    const isRequisition = type === "requisition";
    const initialStatus = getCreationStatus(type);
    const historyComment = isRequisition
      ? "Demande envoyée directement au vérificateur (réquisition interne)"
      : "";
    try {
      const created = await api.createRequest({
        type, title,
        authorId: user.id, authorName: user.name,
        date: today, formData,
        status: initialStatus, historyComment,
      });
      setRequests((prev) => [created, ...prev]);
    } catch (err) {
      alert("Erreur lors de l'envoi de la demande : " + err.message);
    }
  }

  async function handleAction(reqId, newStatus, comment, actionUser, adminComment = "", updatedRows = null) {
    // Messages de confirmation selon l'action
    const confirmMessages = {
      acceptee:   "Confirmer l'approbation de cette demande ?",
      acceptee2:  "Confirmer l'approbation (Approbateur +) de cette demande ?\n\nLa demande sera transmise au vérificateur.",
      validee:    "Confirmer la vérification ?\n\nLa demande sera transmise à l'agent administratif pour traitement.",
      validee_C2: "Attribuer cette réquisition au Magasinier ?\n\nIl pourra la traiter et la compléter.",
      validee_C3: "Attribuer cette réquisition au Concierge ?\n\nIl pourra la traiter et la compléter.",
      commandee:             "Confirmer que les items ont été commandés ?",
      partiellement_traitee: "Enregistrer la demande comme partiellement complétée ?\n\nElle restera dans la file d'attente pour un traitement ultérieur.",
      traitee:               "Confirmer que la demande est complétée / traitée ?\n\nCette action est finale.",
      refusee:    "Confirmer le refus de cette demande ?",
      annulee:    "Confirmer l'annulation de cette demande ?",
    };

    // Statuts personnalisés ajoutés par l'administrateur dans la chaîne de traitement :
    // pas de message dédié, on retombe sur une confirmation générique.
    const confirmMsg = confirmMessages[newStatus] || "Confirmer cette action ?";
    if (!window.confirm(confirmMsg)) return;

    try {
      const updated = await api.actionRequest(reqId, { newStatus, comment, adminComment, by: actionUser.name, updatedRows });
      setRequests((prev) => prev.map((r) => r.id === reqId ? updated : r));
      // Ne change pas de vue : si l'action vient de la fiche détail, selectedRequest correspond déjà
      // à reqId et se met à jour en place ; si elle vient d'un tableau (file d'attente), on reste sur
      // ce tableau au lieu d'être redirigé vers la fiche détail d'une AUTRE demande précédemment consultée.
      if (selectedRequest?.id === reqId) setSelectedRequest(updated);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  async function handleUpdateItems(reqId, updatedRows) {
    // Met à jour les items (commandé/reçu) sans changer le statut
    try {
      const updated = await api.updateItems(reqId, updatedRows);
      setRequests((prev) => prev.map((r) => r.id === reqId ? updated : r));
      if (selectedRequest?.id === reqId) setSelectedRequest(updated);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  async function handleSaveAuthorizations(reqId, cpeAuth, ceAuth) {
    const req = requests.find((r) => r.id === reqId);
    if (!req) return;
    try {
      const updated = await api.updateRequest(reqId, {
        formData: { ...req.formData, cpeAuth, ceAuth },
      });
      setRequests((prev) => prev.map((r) => r.id === reqId ? updated : r));
      if (selectedRequest?.id === reqId) setSelectedRequest(updated);
    } catch (err) {
      alert("Erreur lors de la sauvegarde des autorisations : " + err.message);
    }
  }

  function handleEdit(request, nextStatus, comment) {
    setEditContext({ request, nextStatus, comment });
    if (request.type === "activite") {
      setView("edit_activite");
    } else if (request.type === "requisition") {
      setView("edit_requisition");
    } else {
      setView("edit_achat");
    }
  }

  function buildEditTitle(type, fd, fallback) {
    if (type === "achat") return (fd.natureActivite || fallback || "Demande d'achat").slice(0, 60);
    if (type === "activite") return (fd.nomActivite || fd["Nom de l'activité"] || fallback || "Demande d'activité").slice(0, 60);
    if (type === "requisition") return (fd.titre || fallback || "Demande de réquisition interne").slice(0, 60);
    return fallback;
  }

  async function handleSaveEdit(newFormData) {
    const { request, nextStatus, comment } = editContext;
    const newTitle = buildEditTitle(request.type, newFormData, request.title);
    const changingStatus = nextStatus && nextStatus !== "auteur";
    const statusToSend = changingStatus ? nextStatus : request.status;
    const historyComment = changingStatus
      ? (comment || "Modifiée et " + nextStatus)
      : ("Demande modifiée par " + user.name);
    try {
      await api.updateRequest(request.id, { title: newTitle, formData: newFormData });
      const updated = await api.actionRequest(request.id, { newStatus: statusToSend, comment: historyComment, by: user.name });
      setRequests((prev) => prev.map((r) => r.id === request.id ? updated : r));
      setSelectedRequest((prev) => prev && prev.id === request.id ? updated : prev);
      setEditContext(null);
      setView("detail");
    } catch (err) {
      alert("Erreur lors de l'enregistrement : " + err.message);
    }
  }

  async function handleSaveEditAndApprove(newFormData) {
    // Enregistre les modifications ET passe le statut à "acceptee"
    const { request } = editContext;
    const newTitle = buildEditTitle(request.type, newFormData, request.title);
    try {
      await api.updateRequest(request.id, { title: newTitle, formData: newFormData });
      const updated = await api.actionRequest(request.id, { newStatus: "acceptee", comment: "Demande modifiée et approuvée par " + user.name, by: user.name });
      setRequests((prev) => prev.map((r) => r.id === request.id ? updated : r));
      setSelectedRequest((prev) => prev && prev.id === request.id ? updated : prev);
      setEditContext(null);
      setView("detail");
    } catch (err) {
      alert("Erreur lors de l'enregistrement : " + err.message);
    }
  }

  async function handleCancelRequest(reqId, actionUser) {
    try {
      const updated = await api.actionRequest(reqId, { newStatus: "annulee", comment: "Demande annulée par l'auteur. L'approbateur a été avisé.", by: actionUser.name });
      setRequests((prev) => prev.map((r) => r.id === reqId ? updated : r));
      if (selectedRequest?.id === reqId) setSelectedRequest(updated);
      setView("dashboard");
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  async function handleReactivate(reqId, targetStatus, actionUser) {
    if (!window.confirm("Réactiver cette demande ?\n\nElle reprendra son traitement à l'étape où elle se trouvait avant le refus.")) return;
    try {
      const updated = await api.actionRequest(reqId, { newStatus: targetStatus, comment: "Demande réactivée par " + actionUser.name, by: actionUser.name });
      setRequests((prev) => prev.map((r) => r.id === reqId ? updated : r));
      if (selectedRequest?.id === reqId) setSelectedRequest(updated);
      setView(prev => prev === "history" ? "history" : "detail");
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  async function handleUpdateRoles(updatedUsers) {
    const prevIds = new Set(allUsers.map(u => u.id));
    const newIds  = new Set(updatedUsers.map(u => u.id));
    const removed = allUsers.filter(u => !newIds.has(u.id));
    const added   = updatedUsers.filter(u => !prevIds.has(u.id));
    const changed = updatedUsers.filter(u => {
      if (!prevIds.has(u.id)) return false;
      const old = allUsers.find(x => x.id === u.id);
      return old && JSON.stringify([...old.roles].sort()) !== JSON.stringify([...u.roles].sort());
    });

    try {
      for (const u of removed) await api.deleteUser(u.id);
      const createdMap = {};
      for (const u of added) {
        createdMap[u.id] = await api.createUser({ name: u.name, email: u.email, password: u.password, roles: u.roles });
      }
      for (const u of changed) await api.updateUserRoles(u.id, u.roles);

      const finalUsers = updatedUsers.map(u => createdMap[u.id] || u);
      setAllUsers(finalUsers);
      if (user) {
        const updatedSelf = finalUsers.find((u) => u.id === user.id);
        if (updatedSelf) setUser(updatedSelf);
      }
    } catch (err) {
      alert("Erreur lors de la synchronisation des utilisateurs avec le serveur : " + err.message);
    }
  }

  async function handleDeleteYear(schoolYear) {
    try {
      await api.deleteSchoolYear(schoolYear);
      setRequests((prev) => prev.filter((r) => getSchoolYear(r.date) !== schoolYear));
    } catch (err) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  }

  function persistSetting(key, setter) {
    // Accepte une valeur directe ou une fonction de mise à jour (prev => next)
    return (valueOrUpdater) => {
      setter((prev) => {
        const next = typeof valueOrUpdater === "function" ? valueOrUpdater(prev) : valueOrUpdater;
        api.updateSetting(key, next).catch((err) => alert(`Erreur lors de l'enregistrement (${key}) : ` + err.message));
        return next;
      });
    };
  }
  const updateServiceTypes      = persistSetting("serviceTypes", setServiceTypes);
  const updateActiveForms       = persistSetting("activeForms", setActiveForms);
  const updateStatusDefinitions = persistSetting("statusDefinitions", setStatusDefinitions);
  const updateApprobateurRules  = persistSetting("approbateurRules", setApprobateurRules);
  const updateNiveauxList       = persistSetting("niveauxList", setNiveauxList);
  const updateFournisseurList   = persistSetting("fournisseurList", setFournisseurList);
  const updatePassionCategories = persistSetting("passionCategories", setPassionCategories);
  const updateMatieresList      = persistSetting("matieresList", setMatieresList);
  const updateWorkflowConfig    = persistSetting("workflowConfig", setWorkflowConfig);
  const updateNotificationConfig = persistSetting("notificationConfig", setNotificationConfig);
  const updateShowDemoAccounts  = persistSetting("showDemoAccounts", setShowDemoAccounts);

  if (loading) {
    return (
      <div style={{ ...S.page, display: "flex", flexDirection: "column" }}>
        <Topbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: COLORS.gris }}>
          Chargement des données…
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ ...S.page, display: "flex", flexDirection: "column" }}>
        <Topbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ ...S.card, maxWidth: 480, padding: 28, textAlign: "center" }} className="s-card">
            <h3 style={{ margin: "0 0 10px", color: COLORS.rouge }}>Connexion au serveur impossible</h3>
            <p style={{ fontSize: 13, color: COLORS.gris }}>{loadError}</p>
            <button style={{ ...S.btnPrimary, marginTop: 12 }} onClick={() => window.location.reload()}>Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={handleLogin} showDemoAccounts={showDemoAccounts} />;

  function renderView() {
    if (view === "dashboard") {
      return <Dashboard user={user} requests={requests} setView={setView} setSelectedRequest={setSelectedRequest} activeForms={activeForms} setPrevView={setPrevView} statusDefinitions={statusDefinitions} calendarEvents={calendarEvents} onSaveCalendarEvents={handleSaveCalendarEvents} workflowConfig={workflowConfig} />;
    }
    if (view === "form_achat") {
      return <FormAchat user={user} onSubmit={handleSubmitRequest} onBack={() => setView("dashboard")} allUsers={allUsers} approbateurRules={approbateurRules} niveauxList={niveauxList} matieresList={matieresList} fournisseurList={fournisseurList} passionCategories={passionCategories} />;
    }
    if (view === "form_activite") {
      return <FormActivite user={user} onSubmit={handleSubmitRequest} onBack={() => setView("dashboard")} allUsers={allUsers} approbateurRules={approbateurRules} niveauxList={niveauxList} matieresList={matieresList} passionCategories={passionCategories} />;
    }
    if (view === "form_requisition") {
      return <FormRequisition user={user} onSubmit={handleSubmitRequest} onBack={() => setView("dashboard")} serviceTypes={serviceTypes} />;
    }
    if (view === "detail" && selectedRequest) {
      return <RequestDetail
        key={selectedRequest.id}
        request={selectedRequest}
        user={user}
        onAction={handleAction}
        onBack={() => setView(prevView || "dashboard")}
        onEdit={handleEdit}
        onCancel={handleCancelRequest}
        onUpdateItems={handleUpdateItems}
        onSaveAuthorizations={handleSaveAuthorizations}
        onReactivate={handleReactivate}
        workflowConfig={workflowConfig}
      />;
    }
    if (view === "edit_achat" && editContext) {
      // Approbateur (rôle A ou admin) sur demande soumise → peut approuver en même temps
      const canApproveOnEdit = (user.roles.includes("A") || user.roles.includes("D")) && editContext.request.status === "soumise";
      return <FormAchat
        user={user}
        allUsers={allUsers}
        initialData={editContext.request.formData}
        editMode={true}
        onSubmit={handleSaveEdit}
        onApprove={canApproveOnEdit ? handleSaveEditAndApprove : undefined}
        onBack={() => { setEditContext(null); setView("detail"); }}
        approbateurRules={approbateurRules}
        niveauxList={niveauxList}
        matieresList={matieresList}
        fournisseurList={fournisseurList}
        passionCategories={passionCategories}
      />;
    }
    if (view === "edit_activite" && editContext) {
      return <FormActivite
        user={user}
        allUsers={allUsers}
        initialData={editContext.request.formData}
        editMode={true}
        onSubmit={handleSaveEdit}
        onBack={() => { setEditContext(null); setView("detail"); }}
        approbateurRules={approbateurRules}
        niveauxList={niveauxList}
        matieresList={matieresList}
        passionCategories={passionCategories}
      />;
    }
    if (view === "edit_requisition" && editContext) {
      return <FormRequisition
        user={user}
        serviceTypes={serviceTypes}
        initialData={editContext.request.formData}
        editMode={true}
        onSubmit={handleSaveEdit}
        onBack={() => { setEditContext(null); setView("detail"); }}
      />;
    }
    if (view === "queue_A") {
      return <QueueView role="A" allRequests={requests} workflowConfig={workflowConfig} requests={requests.filter(r => isPendingForRole(r, "A", workflowConfig) && (user.roles.includes("D") || !r.formData || r.formData.directionResponsable === user.name))} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_A")} />;
    }
    if (view === "queue_A2") {
      return <QueueView role="A2" allRequests={requests} workflowConfig={workflowConfig} requests={requests.filter(r => isPendingForRole(r, "A2", workflowConfig))} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_A2")} />;
    }
    if (view === "queue_B") {
      return <QueueView role="B" allRequests={requests} workflowConfig={workflowConfig} requests={requests.filter(r => isPendingForRole(r, "B", workflowConfig))} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_B")} />;
    }
    if (view === "queue_C1") {
      return <QueueView role="C1" allRequests={requests} workflowConfig={workflowConfig} label="Agent administratif" requests={requests.filter(r => isPendingC1(r, workflowConfig))} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_C1")} />;
    }
    if (view === "queue_C2") {
      return <QueueView role="C2" allRequests={requests} workflowConfig={workflowConfig} label="Magasinier" requests={requests.filter(r => isPendingC2(r, workflowConfig))} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_C2")} />;
    }
    if (view === "queue_C3") {
      return <QueueView role="C3" allRequests={requests} workflowConfig={workflowConfig} label="Concierge" requests={requests.filter(isPendingC3)} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_C3")} />;
    }
    if (view === "history") {
      return <HistoryView user={user} requests={requests} setView={setView} setSelectedRequest={setSelectedRequest} onDeleteYear={handleDeleteYear} workflowConfig={workflowConfig} />;
    }
    if (view === "admin" && user.roles.includes("D")) {
      return <AdminView onBack={() => setView("dashboard")} allUsers={allUsers} onUpdateRoles={handleUpdateRoles} serviceTypes={serviceTypes} onUpdateServiceTypes={updateServiceTypes} activeForms={activeForms} onUpdateActiveForms={updateActiveForms} statusDefinitions={statusDefinitions} onUpdateStatusDefinitions={updateStatusDefinitions} approbateurRules={approbateurRules} onUpdateApprobateurRules={updateApprobateurRules} niveauxList={niveauxList} onUpdateNiveauxList={updateNiveauxList} matieresList={matieresList} onUpdateMatieresList={updateMatieresList} workflowConfig={workflowConfig} onUpdateWorkflowConfig={updateWorkflowConfig} notificationConfig={notificationConfig} onUpdateNotificationConfig={updateNotificationConfig} showDemoAccounts={showDemoAccounts} onUpdateShowDemoAccounts={updateShowDemoAccounts} fournisseurList={fournisseurList} onUpdateFournisseurList={updateFournisseurList} passionCategories={passionCategories} onUpdatePassionCategories={updatePassionCategories} />;
    }
    return <Dashboard user={user} requests={requests} setView={setView} setSelectedRequest={setSelectedRequest} statusDefinitions={statusDefinitions} calendarEvents={calendarEvents} onSaveCalendarEvents={handleSaveCalendarEvents} workflowConfig={workflowConfig} />;
  }

  return (
    <div style={S.page}>
      <Topbar user={user} onLogout={handleLogout} setView={setView} requests={requests} />
      <DemoBanner />
      {/* Nav tabs */}
      <div style={{ background: "#fff", borderBottom: "2px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", flexWrap: "wrap", gap: 0 }}>
          {[
            { key: "dashboard", label: "📊 Tableau de bord" },
            { key: "history", label: "📋 Historique" },
            ...(user.roles.includes("A") ? [{ key: "queue_A", label: "👍 Approbateur" }] : []),
            ...(user.roles.includes("A2") ? [{ key: "queue_A2", label: "➕ Approbateur +" }] : []),
            ...(user.roles.includes("B") ? [{ key: "queue_B", label: "✅ Vérificateur" }] : []),
            ...(user.roles.includes("C1") ? [{ key: "queue_C1", label: "📝 Agent administratif" }] : []),
            ...(user.roles.includes("C2") ? [{ key: "queue_C2", label: "📦 Magasinier" }] : []),
            ...(user.roles.includes("C3") ? [{ key: "queue_C3", label: "🔧 Concierge" }] : []),
            ...(user.roles.includes("D") ? [{ key: "admin", label: "⚙️ Admin" }] : []),
          ].map((tab) => {
            const active = view === tab.key || (view.startsWith("form") && tab.key === "dashboard") || (view === "detail" && tab.key === "dashboard") || (view === "edit_achat" && tab.key === "dashboard") || (view === "edit_activite" && tab.key === "dashboard");
            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                style={{
                  padding: "12px 18px", border: "none", background: "transparent", cursor: "pointer",
                  fontSize: 13, fontWeight: active ? 700 : 400,
                  color: active ? COLORS.vertFonce : COLORS.gris,
                  borderBottom: active ? `3px solid ${COLORS.vert}` : "3px solid transparent",
                  marginBottom: -2,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {renderView()}
    </div>
  );
}
