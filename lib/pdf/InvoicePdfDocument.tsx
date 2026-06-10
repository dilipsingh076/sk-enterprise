import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { InvoiceTotals } from "@/lib/invoice/calculations";
import { normalizeInvoiceDateStorage } from "@/lib/invoice/formatInvoiceDate";
import type { Invoice } from "@/lib/invoice/schema";

const BORDER = "#000";
const GRID = "#000";
const SHADE = "#e8e8e8";
const TAX_BAR = "#cfcfcf";
const HEADER_BG = "#0a0a0a";

const styles = StyleSheet.create({
  page: {
    fontSize: 8,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 14,
    fontFamily: "Helvetica",
    color: "#000",
  },
  /** Logo + readable seller line — high contrast, no decorative banner layout */
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#fff",
  },
  headerLogo: {
    width: 64,
    height: 64,
  },
  headerTextCol: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    paddingRight: 8,
  },
  headerCompanyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#000",
    lineHeight: 1.15,
    marginBottom: 2,
  },
  headerDescription: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#222",
    lineHeight: 1.25,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  headerGstin: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000",
    lineHeight: 1.3,
  },
  headerQrWrap: {
    width: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  headerQr: {
    width: 42,
    height: 42,
  },
  taxInvoiceBar: {
    backgroundColor: TAX_BAR,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingVertical: 4,
  },
  taxInvoiceText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    letterSpacing: 0.4,
  },

  outer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },

  rowDivided: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: GRID,
  },
  rowDividedNoBottom: {
    flexDirection: "row",
  },
  cellPad: { paddingVertical: 2, paddingHorizontal: 4 },

  topBuyerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: GRID,
  },
  topBuyerLeft: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 8,
    /** Slanted text — do not combine Helvetica-Bold with fontStyle italic (font resolution fails). */
    fontFamily: "Helvetica-Oblique",
  },
  topBuyerRight: {
    flex: 1.5,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderLeftWidth: 1,
    borderColor: GRID,
    fontSize: 7,
    textAlign: "right",
  },
  irnLabel: { fontFamily: "Helvetica-Bold" },

  metaGridRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: GRID },
  metaGridRowLast: { flexDirection: "row", borderBottomWidth: 1, borderColor: GRID },
  metaGridHalf: { flex: 1, flexDirection: "row", minHeight: 16 },
  metaGridHalfWrap: { flex: 1 },
  metaGridEmptyHalf: { flex: 1, minHeight: 16 },
  metaPair: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderColor: GRID,
  },
  metaPairLast: { flexDirection: "row", alignItems: "stretch" },
  metaLabelCell: {
    width: "38%",
    flexShrink: 0,
    paddingVertical: 2,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  metaLabelText: {
    fontSize: 7.5,
  },
  metaValueCell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderLeftWidth: 1,
    borderColor: GRID,
  },
  metaValueText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },
  vsplit: { borderLeftWidth: 1, borderColor: GRID },

  partyHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: GRID },
  partyHeaderCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  partyHeaderLabel: { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 8 },
  partyHeaderBadge: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingHorizontal: 4,
  },

  partyBodyRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: GRID },
  partyBody: {
    flex: 1,
    padding: 4,
    minHeight: 56,
  },
  partyName: { fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 1 },
  partyText: { fontSize: 7.5, lineHeight: 1.35 },

  partyDetailRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: GRID },
  partyDetailHalf: { flex: 1, flexDirection: "row" },
  pdLabel: {
    width: "32%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 7.5,
  },
  pdValue: {
    width: "68%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    borderLeftWidth: 1,
    borderColor: GRID,
  },

  hypoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: GRID,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 7.5,
  },

  fullWidthTable: {
    width: "100%",
    alignSelf: "stretch",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  thRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    paddingVertical: 4,
    paddingHorizontal: 3,
  },
  /** Line-items table header text (padding lives on the cell). */
  itemsThText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    paddingHorizontal: 3,
    paddingVertical: 0,
  },
  itemsHeaderCell: {
    alignSelf: "stretch",
    justifyContent: "center",
    backgroundColor: SHADE,
    borderBottomWidth: 1,
    borderColor: GRID,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  itemsHeaderCellSplit: {
    borderLeftWidth: 1,
    borderColor: GRID,
  },
  tr: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  itemsBodyCell: {
    alignSelf: "stretch",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: GRID,
    paddingVertical: 3,
    paddingHorizontal: 0,
  },
  itemsBodyCellSplit: {
    borderLeftWidth: 1,
    borderColor: GRID,
  },
  itemsBodyDescCell: {
    alignSelf: "stretch",
    justifyContent: "flex-start",
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: GRID,
    paddingVertical: 3,
    paddingHorizontal: 3,
  },

  tdC: { fontSize: 7.5, textAlign: "center", paddingHorizontal: 3 },
  tdL: { fontSize: 7.5, textAlign: "left", paddingHorizontal: 3 },
  tdR: { fontSize: 7.5, textAlign: "right", paddingHorizontal: 3 },

  vline: { borderLeftWidth: 1, borderColor: GRID },

  totalsBlock: {
    width: "100%",
    alignSelf: "stretch",
  },
  totalsBody: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  totalsWordsArea: {
    alignSelf: "stretch",
    paddingVertical: 5,
    paddingHorizontal: 5,
    justifyContent: "flex-end",
  },
  totalsFiguresTable: {
    alignSelf: "stretch",
    borderLeftWidth: 1,
    borderColor: GRID,
  },
  totalsFigureRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderColor: GRID,
    minHeight: 22,
  },
  totalsFigureLabelCol: {
    justifyContent: "center",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderColor: GRID,
  },
  totalsFigureValueCol: {
    justifyContent: "center",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  totalsFigureLabelText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
  },
  totalsFigureValueText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },

  grandRow: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: SHADE,
    alignItems: "stretch",
  },
  grandLabelCell: {
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  grandValueCell: {
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  grandLabelText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  grandValueText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },

  certRow: {
    flexDirection: "row",
    marginTop: 6,
    borderWidth: 1,
    borderColor: GRID,
  },
  certLeft: {
    flex: 1.4,
    padding: 5,
    borderRightWidth: 1,
    borderColor: GRID,
  },
  certRight: {
    flex: 1,
    padding: 5,
    alignItems: "flex-end",
  },
  signatureImage: {
    width: 168,
    height: 64,
    objectFit: "contain",
    marginTop: 18,
  },
  termsTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    marginTop: 4,
    marginBottom: 2,
  },
  termsLine: { fontSize: 7, lineHeight: 1.4 },

  footerBar: {
    marginTop: 6,
    backgroundColor: HEADER_BG,
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  footerText: { color: "#fff", fontSize: 7, lineHeight: 1.4 },
  footerBold: { color: "#fff", fontFamily: "Helvetica-Bold" },
});

const DEFAULT_TERMS = `1) Interest will be recovered @ 18% p.a. on overdue unpaid bills.
2) Claims for damages & shortages will be honoured in writing within 3 days from receipt.
3) Subject to jurisdiction as stated below.`;

function fmt(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtQty(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function fmtTaxPct(n: number): string {
  const p = Number(n);
  if (!Number.isFinite(p)) return "0%";
  const rounded = Math.round(p * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(2)}%`;
}


function normalizeQrSrc(raw?: string): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const s = raw.trim();
  if (s.startsWith("data:")) return s;
  return `data:image/png;base64,${s}`;
}

function Multiline({
  text,
  style,
}: {
  text: string;
  style?: Style;
}) {
  const lines = text.split(/\r?\n/);
  return (
    <View>
      {lines.map((line, i) => (
        <Text
          key={i}
          style={style ? [styles.partyText, style] : styles.partyText}
        >
          {line || " "}
        </Text>
      ))}
    </View>
  );
}

function metaGridText(s: string | undefined | null): string {
  return (s ?? "").trim();
}

function MetaGridValueText({ text, dashIfEmpty = false }: { text: string; dashIfEmpty?: boolean }) {
  const valueText = metaGridText(text);
  const display = valueText || (dashIfEmpty ? "—" : " ");
  const lines = display.split("\n");
  if (lines.length <= 1) {
    return <Text style={styles.metaValueText}>{display}</Text>;
  }
  return (
    <View>
      {lines.map((line, i) => (
        <Text key={i} style={[styles.metaValueText, i > 0 ? { marginTop: 1 } : {}]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function purchaserNameGridValue(purchaserName: string | undefined, pan: string | undefined): string {
  const name = metaGridText(purchaserName);
  const panText = metaGridText(pan);
  if (name && panText) return `${name}\nPAN : ${panText}`;
  if (panText) return `PAN : ${panText}`;
  return name;
}

function MetaGridHalf({
  label,
  value,
  dashIfEmpty = false,
}: {
  label: string;
  value: string;
  /** Show em dash when value is empty (only when the paired left cell has a value). */
  dashIfEmpty?: boolean;
}) {
  const labelText = metaGridText(label);
  return (
    <View style={styles.metaGridHalf}>
      <View style={styles.metaLabelCell}>
        <Text style={styles.metaLabelText}>{labelText || " "}</Text>
      </View>
      <View style={styles.metaValueCell}>
        <MetaGridValueText text={value} dashIfEmpty={dashIfEmpty} />
      </View>
    </View>
  );
}

function MetaGridRow({
  left,
  right,
  last = false,
}: {
  left: { label: string; value: string };
  right: { label: string; value: string };
  last?: boolean;
}) {
  const leftHasValue = Boolean(metaGridText(left.value));
  const rightBlank = !metaGridText(right.label) && !metaGridText(right.value);
  const rowStyle = last ? styles.metaGridRowLast : styles.metaGridRow;

  if (rightBlank) {
    return (
      <View style={rowStyle}>
        <View style={styles.metaGridHalfWrap}>
          <MetaGridHalf label={left.label} value={left.value} />
        </View>
        <View style={[styles.metaGridHalfWrap, styles.vsplit, styles.metaGridEmptyHalf]} />
      </View>
    );
  }

  return (
    <View style={rowStyle}>
      <MetaGridHalf label={left.label} value={left.value} />
      <View style={[styles.metaGridHalfWrap, styles.vsplit]}>
        <MetaGridHalf label={right.label} value={right.value} dashIfEmpty={leftHasValue} />
      </View>
    </View>
  );
}

function PartyDetailLine({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  last = false,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.partyDetailRow,
        last ? { borderBottomWidth: 0 } : {},
      ]}
    >
      <View style={styles.partyDetailHalf}>
        <Text style={styles.pdLabel}>{leftLabel}</Text>
        <Text style={styles.pdValue}>{leftValue || "—"}</Text>
      </View>
      <View style={[styles.partyDetailHalf, styles.vline]}>
        <Text style={styles.pdLabel}>{rightLabel}</Text>
        <Text style={styles.pdValue}>{rightValue || "—"}</Text>
      </View>
    </View>
  );
}

/** Column widths must sum to 100% so the table spans the full page content width. */
const colSn = { width: "4%" };
const colDesc = { width: "27%" };
const colHsn = { width: "9%" };
const colQty = { width: "8%" };
const colUom = { width: "6%" };
const colRate = { width: "9%" };
const colGross = { width: "10%" };
const colTax = { width: "9%" };
const colLineTotal = { width: "18%" };

/** Add one blank line-item row when count is at most this (keeps short lists from looking cramped). */
const LINE_ITEMS_FILLER_MAX = 4;

/** Labels in Tax column, values in Total column (divider matches Amount | Tax). */
const TOTALS_TAX_PCT = 9;
const TOTALS_VALUE_PCT = 18;
const totalsWordsWidth = {
  width: `${100 - TOTALS_TAX_PCT - TOTALS_VALUE_PCT}%` as const,
};
const totalsFiguresWidth = {
  width: `${TOTALS_TAX_PCT + TOTALS_VALUE_PCT}%` as const,
};

const FIGURES_COL_SUM = TOTALS_TAX_PCT + TOTALS_VALUE_PCT;
const totalsFiguresLabelColWidth = {
  width: `${(TOTALS_TAX_PCT / FIGURES_COL_SUM) * 100}%` as const,
};
const totalsFiguresValueColWidth = {
  width: `${(TOTALS_VALUE_PCT / FIGURES_COL_SUM) * 100}%` as const,
};

function TotalsFigureRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalsFigureRow}>
      <View style={[styles.totalsFigureLabelCol, totalsFiguresLabelColWidth]}>
        <Text style={styles.totalsFigureLabelText} wrap={false}>
          {label}
        </Text>
      </View>
      <View style={[styles.totalsFigureValueCol, totalsFiguresValueColWidth]}>
        <Text style={styles.totalsFigureValueText} wrap={false}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function InvoicePdfDocument({
  invoice,
  totals,
  amountWords,
  taxAmountWords,
  logoSrc,
  signatureSrc,
  showDraftWatermark = false,
}: {
  invoice: Invoice;
  totals: InvoiceTotals;
  amountWords: string;
  taxAmountWords: string;
  /** Bundled SK logo (base64 data URI), optional if file missing */
  logoSrc?: string | null;
  /** Bundled SK Enterprises proprietor signature (UK issuer only). */
  signatureSrc?: string | null;
  /** Shown on inline PDF preview before final download. */
  showDraftWatermark?: boolean;
}) {
  const { seller, billTo, shipToResolved, eInvoice } = invoice;
  const qrSrc = normalizeQrSrc(eInvoice.qrImageBase64);
  const headerDescription = seller.pdfHeaderDescription?.trim() ?? "";
  const termsText = seller.termsAndConditions?.trim() || DEFAULT_TERMS;
  const certLine =
    seller.certificationLine?.trim() ||
    "Certified that the particulars given above are True and Correct";
  const shipSame = invoice.shipSameAsBill;
  const regdBody = seller.regdOffice?.trim() || seller.address.trim();

  const billStateBadge = `${billTo.stateCode || ""}${
    billTo.stateCode && billTo.stateName ? "" : ""
  }`;
  const shipParty = shipSame ? billTo : shipToResolved;
  const shipStateBadge = shipParty.stateCode || "";
  const showItemsFillerRow = totals.lines.length <= LINE_ITEMS_FILLER_MAX;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBrand} wrap={false}>
          {logoSrc ? <Image src={logoSrc} style={styles.headerLogo} /> : null}
          <View style={[styles.headerTextCol, logoSrc ? { marginLeft: 10 } : { marginLeft: 4 }]}>
            <Text style={styles.headerCompanyName}>{seller.name}</Text>
            {headerDescription ? (
              <Text style={styles.headerDescription}>{headerDescription}</Text>
            ) : null}
            <Text style={styles.headerGstin}>GSTIN: {seller.gstin}</Text>
          </View>
          {qrSrc ? (
            <View style={styles.headerQrWrap}>
              <Image src={qrSrc} style={styles.headerQr} />
            </View>
          ) : null}
        </View>

        <View style={styles.taxInvoiceBar}>
          <Text style={styles.taxInvoiceText}>TAX INVOICE</Text>
        </View>
        {showDraftWatermark ? (
          <Text
            style={{
              textAlign: "center",
              fontSize: 9,
              color: "#666",
              marginBottom: 4,
              fontFamily: "Helvetica-Bold",
            }}
          >
            DRAFT — PREVIEW ONLY
          </Text>
        ) : null}

        <View style={styles.outer}>
          <View style={styles.topBuyerRow}>
            <Text style={styles.topBuyerLeft}>(ISSUED UNDER GST RULES)</Text>
          </View>
          <View style={styles.topBuyerRow}>
            <Text style={styles.topBuyerLeft}>Original For Buyer</Text>
            <View style={styles.topBuyerRight}>
              {eInvoice.irn ? (
                <Text>
                  <Text style={styles.irnLabel}>IRN : </Text>
                  {eInvoice.irn}
                </Text>
              ) : (
                <Text> </Text>
              )}
              {eInvoice.ackNumber ? (
                <Text>
                  <Text style={styles.irnLabel}>Ack No. : </Text>
                  {eInvoice.ackNumber}
                </Text>
              ) : null}
              {eInvoice.ackDate ? (
                <Text>
                  <Text style={styles.irnLabel}>Ack Date : </Text>
                  {normalizeInvoiceDateStorage(eInvoice.ackDate)}
                </Text>
              ) : null}
            </View>
          </View>

          <View>
            <MetaGridRow
              left={{ label: "Invoice No.", value: invoice.invoiceNumber }}
              right={{ label: "Name of Transporter", value: invoice.transport ?? "" }}
            />
            <MetaGridRow
              left={{ label: "Invoice Date", value: normalizeInvoiceDateStorage(invoice.invoiceDate) }}
              right={{ label: "L.R. No. & Date", value: invoice.lrNumberAndDate ?? "" }}
            />
            <MetaGridRow
              left={{ label: "Our GSTIN", value: seller.gstin }}
              right={{ label: "Vehicle No.", value: invoice.vehicle ?? "" }}
            />
            <MetaGridRow
              left={{ label: "Reverse Charge", value: invoice.reverseCharge ? "YES" : "NO" }}
              right={{ label: "Way Bill No.", value: invoice.eWayBill ?? "" }}
            />
            <MetaGridRow
              left={{ label: "Purchase Order No.", value: invoice.poNumber ?? "" }}
              right={{ label: "Delivery Terms", value: invoice.deliveryTermsLine ?? "" }}
            />
            <MetaGridRow
              left={{
                label: "Purchase Order Date",
                value: normalizeInvoiceDateStorage(invoice.purchaseOrderDate),
              }}
              right={{ label: "Delivery Note", value: invoice.deliveryNote ?? "" }}
            />
            <MetaGridRow
              left={{
                label: "Purchaser Name",
                value: purchaserNameGridValue(invoice.purchaserName, billTo.pan),
              }}
              right={{
                label: "Others",
                value: invoice.otherMeta || invoice.destination || "",
              }}
              last
            />
          </View>

          <View style={styles.partyHeaderRow}>
            <View style={styles.partyHeaderCell}>
              <Text style={styles.partyHeaderLabel}>
                Name &amp; Address of Recipient ( Billed to )
              </Text>
              <Text style={styles.partyHeaderBadge}>{billStateBadge}</Text>
            </View>
            <View style={[styles.partyHeaderCell, styles.vline]}>
              <Text style={styles.partyHeaderLabel}>
                Name &amp; Address of Consignee ( Shipped to )
              </Text>
              <Text style={styles.partyHeaderBadge}>{shipStateBadge}</Text>
            </View>
          </View>

          <View style={styles.partyBodyRow}>
            <View style={styles.partyBody}>
              <Text style={styles.partyName}>{billTo.name}</Text>
              <Multiline text={billTo.address} />
            </View>
            <View style={[styles.partyBody, styles.vline]}>
              <Text style={styles.partyName}>{shipParty.name}</Text>
              <Multiline text={shipParty.address} />
            </View>
          </View>

          <PartyDetailLine
            leftLabel="State & Code"
            leftValue={`${billTo.stateCode || ""}-${billTo.stateName || ""}`}
            rightLabel="State & Code"
            rightValue={`${shipParty.stateCode || ""}-${shipParty.stateName || ""}`}
          />
          <PartyDetailLine
            leftLabel="Pincode"
            leftValue={billTo.pincode || "—"}
            rightLabel="Pincode"
            rightValue={shipParty.pincode || billTo.pincode || "—"}
          />
          {billTo.city || shipParty.city ? (
            <PartyDetailLine
              leftLabel="City"
              leftValue={billTo.city || "—"}
              rightLabel="City"
              rightValue={shipParty.city || billTo.city || "—"}
            />
          ) : null}
          <PartyDetailLine
            leftLabel="GSTIN"
            leftValue={billTo.gstin}
            rightLabel="GSTIN"
            rightValue={shipParty.gstin}
          />
          <PartyDetailLine
            leftLabel="Kind Attn."
            leftValue={billTo.kindAttn || "—"}
            rightLabel="Contact No."
            rightValue={shipParty.mobile || billTo.mobile || "—"}
          />

          {invoice.hypothecation ? (
            <View style={styles.hypoRow}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Hypothecation : </Text>
              <Text>{invoice.hypothecation}</Text>
            </View>
          ) : (
            <View style={styles.hypoRow}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Hypothecation :</Text>
            </View>
          )}

          <View style={styles.fullWidthTable} wrap={false}>
            <View style={styles.thRow}>
              <View style={[colSn, styles.itemsHeaderCell]}>
                <Text style={[styles.itemsThText, { textAlign: "center" }]}>
                  S. No.
                </Text>
              </View>
              <View style={[colDesc, styles.itemsHeaderCell, styles.itemsHeaderCellSplit]}>
                <Text style={styles.itemsThText}>Description of Goods</Text>
              </View>
              <View style={[colHsn, styles.itemsHeaderCell, styles.itemsHeaderCellSplit]}>
                <Text style={[styles.itemsThText, { textAlign: "center" }]}>HSN/SAC</Text>
              </View>
              <View style={[colQty, styles.itemsHeaderCell, styles.itemsHeaderCellSplit]}>
                <Text style={[styles.itemsThText, { textAlign: "center" }]}>Quantity</Text>
              </View>
              <View style={[colUom, styles.itemsHeaderCell, styles.itemsHeaderCellSplit]}>
                <Text style={[styles.itemsThText, { textAlign: "center" }]}>UoM</Text>
              </View>
              <View style={[colRate, styles.itemsHeaderCell, styles.itemsHeaderCellSplit]}>
                <Text style={[styles.itemsThText, { textAlign: "right" }]}>Rate</Text>
              </View>
              <View style={[colGross, styles.itemsHeaderCell, styles.itemsHeaderCellSplit]}>
                <Text style={[styles.itemsThText, { textAlign: "center" }]}>Tax %</Text>
              </View>
              <View style={[colTax, styles.itemsHeaderCell, styles.itemsHeaderCellSplit]}>
                <Text style={[styles.itemsThText, { textAlign: "right" }]}>
                  {totals.taxMode === "IGST" ? "IGST" : "CGST/\nSGST"}
                </Text>
              </View>
              <View style={[colLineTotal, styles.itemsHeaderCell, styles.itemsHeaderCellSplit]}>
                <Text style={[styles.itemsThText, { textAlign: "right" }]}>Amount</Text>
              </View>
            </View>
            {totals.lines.map((line, i) => (
              <View key={i} style={styles.tr} wrap={false}>
                <View style={[colSn, styles.itemsBodyCell]}>
                  <Text style={styles.tdC}>{i + 1}</Text>
                </View>
                <View style={[colDesc, styles.itemsBodyDescCell]}>
                  <Multiline text={line.description} />
                </View>
                <View style={[colHsn, styles.itemsBodyCell, styles.itemsBodyCellSplit]}>
                  <Text style={styles.tdC}>{line.hsn}</Text>
                </View>
                <View style={[colQty, styles.itemsBodyCell, styles.itemsBodyCellSplit]}>
                  <Text style={styles.tdR}>{fmtQty(line.quantity)}</Text>
                </View>
                <View style={[colUom, styles.itemsBodyCell, styles.itemsBodyCellSplit]}>
                  <Text style={styles.tdC}>{line.unit}</Text>
                </View>
                <View style={[colRate, styles.itemsBodyCell, styles.itemsBodyCellSplit]}>
                  <Text style={styles.tdR}>{fmt(line.rate)}</Text>
                </View>
                <View style={[colGross, styles.itemsBodyCell, styles.itemsBodyCellSplit]}>
                  <Text style={styles.tdC}>
                    {fmtTaxPct(line.taxPercent ?? totals.gstPercent)}
                  </Text>
                </View>
                <View style={[colTax, styles.itemsBodyCell, styles.itemsBodyCellSplit]}>
                  <Text style={styles.tdR}>{fmt(line.taxAmount)}</Text>
                </View>
                <View style={[colLineTotal, styles.itemsBodyCell, styles.itemsBodyCellSplit]}>
                  <Text style={styles.tdR}>{fmt(line.taxableValue)}</Text>
                </View>
              </View>
            ))}
            {showItemsFillerRow ? (
              <View style={styles.tr} wrap={false}>
                <View style={[colSn, styles.itemsBodyCell]}>
                  <Text style={styles.tdC}> </Text>
                </View>
                <View style={[colDesc, styles.itemsBodyDescCell]} />
                <View style={[colHsn, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
                <View style={[colQty, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
                <View style={[colUom, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
                <View style={[colRate, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
                <View style={[colGross, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
                <View style={[colTax, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
                <View style={[colLineTotal, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
              </View>
            ) : null}
          </View>

          <View style={styles.totalsBlock}>
            <View style={styles.totalsBody}>
              <View style={[styles.totalsWordsArea, totalsWordsWidth]}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8 }}>
                  Grand total in words : -
                </Text>
                <Text style={{ fontSize: 8.5, marginTop: 2 }}>{amountWords}</Text>
              </View>
              <View style={[styles.totalsFiguresTable, totalsFiguresWidth]}>
                <TotalsFigureRow label="Total" value={fmt(totals.subtotalTaxable)} />
                {totals.extraCharges > 0 ? (
                  <TotalsFigureRow
                    label={invoice.extraChargesLabel ?? "Other charges"}
                    value={fmt(totals.extraCharges)}
                  />
                ) : null}
                {totals.taxMode === "IGST" ? (
                  <TotalsFigureRow label="IGST" value={fmt(totals.igst)} />
                ) : (
                  <>
                    <TotalsFigureRow label="CGST" value={fmt(totals.cgst)} />
                    <TotalsFigureRow label="SGST" value={fmt(totals.sgst)} />
                  </>
                )}
                {totals.roundOff !== 0 ? (
                  <TotalsFigureRow
                    label="Round off"
                    value={`${totals.roundOff < 0 ? "-" : "+"}${fmt(Math.abs(totals.roundOff))}`}
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.grandRow}>
              <View style={[styles.grandLabelCell, totalsWordsWidth]}>
                <Text style={styles.grandLabelText}>Grand total</Text>
              </View>
              <View style={[colTax, styles.totalsFigureLabelCol]} />
              <View style={[colLineTotal, styles.grandValueCell, styles.totalsFigureValueCol]}>
                <Text style={styles.grandValueText} wrap={false}>
                  {fmt(totals.grandTotal)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.certRow} wrap={false}>
          <View style={styles.certLeft}>
            <Text style={{ fontSize: 7.5 }}>{certLine}</Text>
            {seller.declaration?.trim() ? (
              <Text style={{ fontSize: 7, marginTop: 2 }}>{seller.declaration.trim()}</Text>
            ) : null}
            <Text style={styles.termsTitle}>Terms &amp; Condition :</Text>
            <Multiline text={termsText} style={styles.termsLine} />
            <View style={{ marginTop: 6 }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 10,
                  marginBottom: 2,
                }}
              >
                {seller.name}
              </Text>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 10,
                  marginBottom: 2,
                }}
              >
                Account No.: {seller.accountNo}
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
                IFSC: {seller.ifsc}
                {seller.branch?.trim() ? `, Branch: ${seller.branch.trim()}` : ""}
              </Text>
            </View>
            <Text style={[styles.termsLine, { marginTop: 4 }]}>
              Tax Amount (in words) : {taxAmountWords}
            </Text>
          </View>
          <View style={styles.certRight}>
            {signatureSrc ? (
              <Image src={signatureSrc} style={styles.signatureImage} />
            ) : (
              <>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>For {seller.name}</Text>
                <View
                  style={{
                    width: 70,
                    height: 60,
                    borderWidth: 1,
                    borderColor: "#aaa",
                    borderStyle: "dashed",
                    marginTop: 4,
                    marginBottom: 4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 6.5, color: "#888" }}>Round Seal</Text>
                </View>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                  Authorised Signatory
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.footerBar} wrap={false}>
          <Text style={[styles.footerText, { marginBottom: 1 }]}>
            <Text style={styles.footerBold}>Regd. Office &amp; Works : </Text>
            {regdBody.replace(/\n/g, ", ")}
          </Text>
          <Text style={[styles.footerText, { marginBottom: 1 }]}>
            <Text style={styles.footerBold}>Tel. : </Text>
            {seller.phone || "—"}
            {"   "}
            <Text style={styles.footerBold}>E-mail : </Text>
            {seller.email || "—"}
          </Text>
          {seller.branchOfficeDetails?.trim() ? (
            <Text style={[styles.footerText, { marginBottom: 1 }]}>
              <Text style={styles.footerBold}>Office : </Text>
              {seller.branchOfficeDetails.trim()}
            </Text>
          ) : null}
          <Text style={[styles.footerText, { marginBottom: 1 }]}>
            {seller.cin?.trim() ? (
              <>
                <Text style={styles.footerBold}>CIN : </Text>
                {seller.cin.trim()}
                {"   "}
              </>
            ) : null}
            {seller.pan?.trim() ? (
              <>
                <Text style={styles.footerBold}>PAN : </Text>
                {seller.pan.trim()}
                {"   "}
              </>
            ) : null}
            <Text style={styles.footerBold}>GSTIN : </Text>
            {seller.gstin}
            {seller.tan?.trim() ? (
              <>
                {"   "}
                <Text style={styles.footerBold}>TAN : </Text>
                {seller.tan.trim()}
              </>
            ) : null}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
