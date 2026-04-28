// hooks/useDiagnosis.js
import { useState, useCallback } from "react";
import { diagnoseImage } from "../services/aiApi";

/**
 * Custom hook quản lý toàn bộ lifecycle của một lần chẩn đoán:
 * idle → loading → success | error
 */
export const useDiagnosis = () => {
  const [status, setStatus]   = useState("idle"); // "idle"|"loading"|"success"|"error"
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [preview, setPreview] = useState(null);

  const diagnose = useCallback(async (file) => {
    if (!file) return;

    // Generate local preview URL
    setPreview(URL.createObjectURL(file));
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const data = await diagnoseImage(file);
      setResult(data);
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }, [preview]);

  return { status, result, error, preview, diagnose, reset };
};
