/**
 * Snapshot of e-Invoice data shown on PDFs (IRN, Ack, QR).
 * When integrating NIC: map API response fields into this shape.
 */
export type EInvoiceSnapshot = {
  irn?: string;
  ackNumber?: string;
  ackDate?: string;
  /** PNG/JPEG as data URL or raw base64 (no prefix) — react-pdf accepts data URLs */
  qrImageBase64?: string;
};
