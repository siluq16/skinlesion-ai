// services/aiApi.js
import axiosClient from "./axiosClient";

/**
 * POST /api/diagnose
 * Gửi ảnh tổn thương da → nhận kết quả ensemble model
 * @param {File} imageFile
 * @returns {Promise<DiagnoseResponse>}
 */
export const diagnoseImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("file", imageFile);

  return axiosClient.post("/api/diagnose", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
