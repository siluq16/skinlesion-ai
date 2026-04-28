// services/chatApi.js
import axiosClient from "./axiosClient";

/**
 * POST /api/chat — chatbot tư vấn
 */
export const sendChatMessage = async (message, diagnosisContext = null, history = []) => {
  return axiosClient.post("/api/chat", {
    message,
    diagnosis_context: diagnosisContext,
    history,
  });
};

/**
 * POST /api/disease-info — thông tin bệnh (có cache server-side)
 */
export const getDiseaseInfo = async (class_id, predicted_label) => {
  return axiosClient.post("/api/disease-info", { class_id, predicted_label });
};