import type { EInvoiceSnapshot } from "./types";

/**
 * Future: call NIC e-Invoice / IRP APIs with signed payload and return EInvoiceSnapshot.
 * v1: use NoOpEInvoiceProvider and manual form fields.
 */
export type EInvoiceProvider = {
  /** Human-readable id for toggles / config */
  readonly id: string;
  generateSnapshot(_input: unknown): Promise<EInvoiceSnapshot>;
};

export class NoOpEInvoiceProvider implements EInvoiceProvider {
  readonly id = "noop";

  async generateSnapshot(): Promise<EInvoiceSnapshot> {
    return {};
  }
}

/*
 * Stub for NIC integration (not implemented):
 *
 * export class NicEInvoiceProvider implements EInvoiceProvider {
 *   readonly id = "nic";
 *   async generateSnapshot(invoice: NicInvoicePayload): Promise<EInvoiceSnapshot> {
 *     // POST to IRP; map response:
 *     // - Irn -> irn
 *     // - AckNo -> ackNumber
 *     // - AckDt -> ackDate
 *     // - SignedQRCode (base64) -> qrImageBase64 (prefix with data:image/png;base64,)
 *   }
 * }
 */
