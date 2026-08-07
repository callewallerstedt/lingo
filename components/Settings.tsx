"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/state";
import { Switch } from "./ui";

export function Settings() {
  const { progress, profileId, syncState, updateSettings, setName, setProfileId, resetAll, syncNow } = useStore();
  const [nameDraft, setNameDraft] = useState(progress.name);
  const [profileDraft, setProfileDraft] = useState(profileId);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => setNameDraft(progress.name), [progress.name]);
  useEffect(() => setProfileDraft(profileId), [profileId]);

  return (
    <div className="stack--lg">
      <Reminders />

      <div className="card stack">
        <div className="section-title">Lernen</div>

        <div className="field">
          <label className="field__label" htmlFor="goal">
            Tagesziel: {progress.settings.dailyGoal} Karten
          </label>
          <input
            id="goal"
            type="range"
            min={10}
            max={200}
            step={5}
            value={progress.settings.dailyGoal}
            onChange={(event) => updateSettings({ dailyGoal: Number(event.target.value) })}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="new">
            Neue Karten pro Tag: {progress.settings.newPerDay}
          </label>
          <input
            id="new"
            type="range"
            min={5}
            max={60}
            step={5}
            value={progress.settings.newPerDay}
            onChange={(event) => updateSettings({ newPerDay: Number(event.target.value) })}
          />
        </div>

        <div className="switch-row">
          <div>
            <div style={{ fontWeight: 600 }}>Übersetzung</div>
            <div className="small muted">Deutsch oder Englisch</div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button
              type="button"
              className={progress.settings.glossLang === "de" ? "chip chip--on" : "chip"}
              onClick={() => updateSettings({ glossLang: "de" })}
            >
              🇩🇪 DE
            </button>
            <button
              type="button"
              className={progress.settings.glossLang === "en" ? "chip chip--on" : "chip"}
              onClick={() => updateSettings({ glossLang: "en" })}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        <div className="switch-row">
          <div>
            <div style={{ fontWeight: 600 }}>Audio automatisch</div>
            <div className="small muted">Schwedisch beim Aufdecken abspielen</div>
          </div>
          <Switch
            checked={progress.settings.autoPlayAudio}
            onChange={(next) => updateSettings({ autoPlayAudio: next })}
          />
        </div>
      </div>

      <div className="card stack">
        <div className="section-title">Profil</div>

        <div className="field">
          <label className="field__label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="input"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={() => setName(nameDraft.trim())}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="profile">
            Sync-Profil
          </label>
          <div className="row">
            <input
              id="profile"
              className="input"
              value={profileDraft}
              onChange={(event) => setProfileDraft(event.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setProfileId(profileDraft)}
              disabled={profileDraft.trim().toLowerCase() === profileId}
            >
              Wechseln
            </button>
          </div>
          <div className="tiny faint">
            Gleicher Name auf allen Geräten = gleicher Fortschritt. Wechseln lädt die App neu.
          </div>
        </div>

        <div className="row row--between">
          <div className="row" style={{ gap: 8 }}>
            <span className="sync-dot" data-state={syncState} />
            <span className="small muted">
              {syncState === "idle"
                ? "Synchronisiert"
                : syncState === "syncing"
                  ? "Synchronisiere…"
                  : syncState === "offline"
                    ? "Nur auf diesem Gerät"
                    : "Sync fehlgeschlagen"}
            </span>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => void syncNow()}>
            Jetzt sichern
          </button>
        </div>
      </div>

      <div className="card stack">
        <div className="section-title">Zurücksetzen</div>
        <div className="small muted">
          Löscht allen Lernfortschritt: Karten, Lektionen, Streak und XP. Lässt sich nicht rückgängig machen.
        </div>
        {confirmReset ? (
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
              }}
            >
              Ja, alles löschen
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(false)}>
              Abbrechen
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(true)}>
            Fortschritt zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}

type PushState = "unsupported" | "unconfigured" | "default" | "granted" | "denied" | "needs-install";

/**
 * iOS only exposes the Push API to PWAs launched from the Home Screen, so the
 * copy has to explain that rather than just failing silently on a Safari tab.
 */
function Reminders() {
  const { profileId } = useStore();
  const [state, setState] = useState<PushState>("default");
  const [publicKey, setPublicKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    (async () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState(isIOS && !isStandalone ? "needs-install" : "unsupported");
        return;
      }

      try {
        const response = await fetch("/api/push/subscribe");
        const data = (await response.json()) as { configured?: boolean; publicKey?: string };
        if (!data.configured || !data.publicKey) {
          setState("unconfigured");
          return;
        }
        setPublicKey(data.publicKey);
      } catch {
        setState("unconfigured");
        return;
      }

      setState(Notification.permission as PushState);

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setSubscribed(Boolean(existing));
    })();
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      setState(permission as PushState);
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileId,
          subscription: subscription.toJSON(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      setSubscribed(true);
    } catch {
      setState("denied");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: profileId, endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card stack">
      <div className="section-title">Erinnerungen</div>
      <div className="small muted">
        Mehrmals täglich eine Push-Nachricht — bis du eine Lektion gemacht hast. Danach ist für heute Ruhe.
      </div>

      {state === "needs-install" ? (
        <div className="trap">
          <span className="trap__label">Auf dem iPhone</span>
          Öffne die App über <strong>Teilen → Zum Home-Bildschirm</strong> und starte sie von dort. iOS erlaubt
          Benachrichtigungen nur für installierte Apps.
        </div>
      ) : state === "unconfigured" ? (
        <div className="small faint">
          Push ist auf dem Server noch nicht eingerichtet (VAPID-Schlüssel fehlen).
        </div>
      ) : state === "unsupported" ? (
        <div className="small faint">Dieser Browser unterstützt keine Push-Nachrichten.</div>
      ) : state === "denied" ? (
        <div className="small faint">
          Benachrichtigungen sind blockiert. Du kannst sie in den Browser-Einstellungen wieder erlauben.
        </div>
      ) : subscribed ? (
        <div className="stack--sm">
          <div className="row" style={{ gap: 8 }}>
            <span className="sync-dot" />
            <span className="small">Erinnerungen sind an</span>
          </div>
          <button type="button" className="btn btn--ghost" onClick={disable} disabled={busy}>
            Ausschalten
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn--primary btn--block" onClick={enable} disabled={busy || !publicKey}>
          {busy ? "Moment…" : "🔔 Erinnerungen einschalten"}
        </button>
      )}
    </div>
  );
}

/** VAPID keys arrive base64url-encoded; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}
