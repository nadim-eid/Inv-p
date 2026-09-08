import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserQRCodeReader } from "@zxing/browser";
import Layout from "../components/Layout.jsx";

// Format attendu d'un identifiant produit, pour une validation immediate
// avant meme d'interroger le backend.
const ID_PATTERN = /^CHEM-[0-9A-F]{8}$/i;

export default function Scanner() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const hasNavigatedRef = useRef(false);

  const [cameraError, setCameraError] = useState("");
  const [manualId, setManualId] = useState("");
  const [status, setStatus] = useState("Initialisation de la caméra…");

  useEffect(() => {
    let cancelled = false;

    if (!window.isSecureContext) {
      setCameraError(
        "L'accès à la caméra nécessite HTTPS. Utilisez le lien https:// de l'application ou saisissez l'identifiant manuellement ci-dessous."
      );
      return;
    }

    const codeReader = new BrowserQRCodeReader();

    async function start() {
      try {
        setStatus("Caméra active — visez le QR code du produit");
        const controls = await codeReader.decodeFromConstraints(
          {
            audio: false,
            // Camera arriere prioritaire (facingMode: environment), avec
            // repli "ideal" pour compatibilite Safari iOS / anciens Android.
            video: { facingMode: { ideal: "environment" } },
          },
          videoRef.current,
          (result, err, ctrls) => {
            if (cancelled || hasNavigatedRef.current) return;
            if (result) {
              const text = result.getText().trim();
              hasNavigatedRef.current = true;
              ctrls.stop(); // arret immediat du scanner apres detection
              const id = text.toUpperCase();
              if (ID_PATTERN.test(id)) {
                navigate(`/produit/${id}`);
              } else {
                // QR valide en tant que code, mais pas un identifiant produit connu
                navigate(`/produit/${encodeURIComponent(text)}`);
              }
            }
            // Les erreurs de decodage "frame par frame" (NotFoundException)
            // sont normales tant qu'aucun QR n'est dans le cadre : on les ignore.
          }
        );
        controlsRef.current = controls;
      } catch (err) {
        if (cancelled) return;
        setCameraError(
          "Impossible d'accéder à la caméra (permission refusée ou non disponible). Utilisez la saisie manuelle ci-dessous."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [navigate]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const id = manualId.trim().toUpperCase();
    if (!id) return;
    controlsRef.current?.stop();
    navigate(`/produit/${encodeURIComponent(id)}`);
  };

  return (
    <Layout title="Scanner" showBack>
      {!cameraError && (
        <>
          <div className="scanner-viewport">
            <video ref={videoRef} muted playsInline autoPlay />
            <div className="scanner-frame" />
          </div>
          <p className="helper-text" style={{ textAlign: "center", marginTop: 10 }}>
            {status}
          </p>
        </>
      )}

      {cameraError && <div className="banner banner-error">{cameraError}</div>}

      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ fontWeight: 600, marginTop: 0 }}>Saisie manuelle de l'identifiant</p>
        <form onSubmit={handleManualSubmit}>
          <div className="field">
            <label htmlFor="manual-id">Identifiant produit (ex : CHEM-A81F42D3)</label>
            <input
              id="manual-id"
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="CHEM-XXXXXXXX"
              autoCapitalize="characters"
              autoComplete="off"
            />
          </div>
          <button className="btn btn-primary btn-large" type="submit">
            Rechercher le produit
          </button>
        </form>
      </div>
    </Layout>
  );
}
