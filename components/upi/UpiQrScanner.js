"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { CameraOff, RefreshCw } from "lucide-react";

// Scans UPI QR codes using the device camera. Decodes frames locally with
// jsQR (no external service ever sees the camera feed or the scanned data).
export default function UpiQrScanner({ onScan }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("starting"); // starting | active | denied | unsupported | error

  useEffect(() => {
    let stream = null;
    let rafId = null;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    function tick() {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          onScan(code.data);
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus("active");
        tick();
      } catch (err) {
        if (stopped) return;
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") setStatus("denied");
        else if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") setStatus("unsupported");
        else setStatus("error");
      }
    }

    start();

    return () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "denied") {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl bg-warning-light p-6 text-center">
        <CameraOff size={28} className="text-warning" />
        <p className="text-sm font-medium">Camera access denied</p>
        <p className="text-xs text-muted">Allow camera access in your browser settings, or enter the UPI ID manually below.</p>
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-background p-6 text-center">
        <CameraOff size={28} className="text-muted" />
        <p className="text-sm font-medium">No camera found</p>
        <p className="text-xs text-muted">Enter the UPI ID manually below.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl bg-danger-light p-6 text-center">
        <CameraOff size={28} className="text-danger" />
        <p className="text-sm font-medium text-danger">Could not start the camera</p>
        <p className="text-xs text-muted">Enter the UPI ID manually below.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
      {status === "starting" ? (
        <p className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/80 py-3 text-xs text-white">
          <RefreshCw size={12} className="animate-spin" /> Starting camera…
        </p>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-10">
          <div className="h-full w-full rounded-2xl border-2 border-white/70" />
        </div>
      )}
    </div>
  );
}
