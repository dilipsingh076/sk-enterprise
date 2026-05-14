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
import type { Invoice } from "@/lib/invoice/schema";

const BORDER = "#000";
const GRID = "#000";
const SHADE = "#e8e8e8";
const TAX_BAR = "#cfcfcf";
const HEADER_BG = "#0a0a0a";

/** Blank strip under line items: shrinks as more rows are added; keeps a minimum for short lists. */
const LINE_ITEMS_FILL_MIN = 28;
const LINE_ITEMS_BLOCK_TARGET = 160;
const LINE_ITEMS_HEADER_APPROX = 30;
const LINE_ITEMS_ROW_APPROX = 24;

function lineItemsBlankFillHeight(lineCount: number): number {
  const used =
    LINE_ITEMS_HEADER_APPROX + Math.max(0, lineCount) * LINE_ITEMS_ROW_APPROX;
  return Math.max(LINE_ITEMS_FILL_MIN, LINE_ITEMS_BLOCK_TARGET - used);
}

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

  metaCol: { flex: 1, flexDirection: "column" },
  metaSplit: { flexDirection: "row" },
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

  thRow: {
    flexDirection: "row",
    alignItems: "stretch",
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

  blankFillRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },

  /** HSN / tax sub-table (separate column widths from line items). */
  taxThRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderColor: GRID,
    backgroundColor: SHADE,
  },
  taxCellWrap: {
    alignSelf: "stretch",
    justifyContent: "center",
  },

  totalsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: GRID,
  },
  totalsLeft: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  totalsRight: {
    flex: 1,
    flexDirection: "row",
    borderLeftWidth: 1,
    borderColor: GRID,
  },
  totalsLabelCell: {
    width: "55%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  totalsValueCell: {
    width: "45%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    borderLeftWidth: 1,
    borderColor: GRID,
  },
  totalsRowDivided: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: GRID,
  },

  grandRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: GRID,
    backgroundColor: SHADE,
  },
  grandLeft: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  grandRight: {
    flex: 1,
    flexDirection: "row",
    borderLeftWidth: 1,
    borderColor: GRID,
  },
  grandLabel: {
    width: "55%",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  grandValue: {
    width: "45%",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    borderLeftWidth: 1,
    borderColor: GRID,
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

function fmtPct(n: number) {
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

function MetaPair({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={last ? styles.metaPairLast : styles.metaPair}>
      <View style={styles.metaLabelCell}>
        <Text style={styles.metaLabelText}>{label}</Text>
      </View>
      <View style={styles.metaValueCell}>
        <Text style={styles.metaValueText}>{value || "—"}</Text>
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

const colSn = { width: "5%" };
const colDesc = { width: "38%" };
const colHsn = { width: "12%" };
const colQty = { width: "10%" };
const colUom = { width: "7%" };
const colRate = { width: "13%" };
const colAmt = { width: "15%" };

export function InvoicePdfDocument({
  invoice,
  totals,
  amountWords,
  taxAmountWords,
  logoSrc,
}: {
  invoice: Invoice;
  totals: InvoiceTotals;
  amountWords: string;
  taxAmountWords: string;
  /** Bundled SK logo (base64 data URI), optional if file missing */
  logoSrc?: string | null;
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
  const lineItemsFillH = lineItemsBlankFillHeight(totals.lines.length);

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
                  {eInvoice.ackDate}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.metaSplit}>
            <View style={styles.metaCol}>
              <MetaPair label="Invoice No." value={invoice.invoiceNumber} />
              <MetaPair label="Invoice Date" value={invoice.invoiceDate} />
              <MetaPair label="Our GSTIN" value={seller.gstin} />
              <MetaPair label="Reverse Charge" value={invoice.reverseCharge ? "YES" : "NO"} />
              <MetaPair
                label="Freight Payment Terms"
                value={invoice.freightPaymentTerms || "—"}
              />
              <MetaPair label="Insurance Terms" value={invoice.insuranceTerms || "—"} />
              <MetaPair label="Delivery Terms" value={invoice.deliveryTermsLine || "—"} />
              <MetaPair label="Machine Sr. No." value={invoice.machineSerialNo || "—"} />
              <MetaPair
                label="Place of Supply"
                value={`${invoice.placeOfSupplyCode}-${invoice.placeOfSupplyState}`}
                last
              />
            </View>
            <View style={[styles.metaCol, styles.vsplit]}>
              <MetaPair label="Purchase Order No." value={invoice.poNumber || "—"} />
              <MetaPair label="Purchase Order Date" value={invoice.purchaseOrderDate || "—"} />
              <MetaPair label="Buyer's PAN" value={billTo.pan || "—"} />
              <MetaPair label="Payment Terms" value={invoice.paymentTerms || "—"} />
              <MetaPair label="Name of Transporter" value={invoice.transport || "—"} />
              <MetaPair label="L.R. No. & Date" value={invoice.lrNumberAndDate || "—"} />
              <MetaPair label="Vehicle No." value={invoice.vehicle || "—"} />
              <MetaPair label="Way Bill No." value={invoice.eWayBill || "—"} />
              <MetaPair label="Others" value={invoice.otherMeta || invoice.destination || "—"} last />
            </View>
          </View>

          <View style={[styles.partyHeaderRow, { borderTopWidth: 1, borderColor: GRID }]}>
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
              {shipSame ? (
                <Text style={[styles.partyText, { color: "#666", marginTop: 2 }]}>
                  (Same as billed to above)
                </Text>
              ) : null}
            </View>
          </View>

          <PartyDetailLine
            leftLabel="State & Code"
            leftValue={`${billTo.stateCode || ""}-${billTo.stateName || ""}`}
            rightLabel="State & Code"
            rightValue={`${shipParty.stateCode || ""}-${shipParty.stateName || ""}`}
          />
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

          <View wrap={false}>
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
              <View style={[colAmt, styles.itemsHeaderCell, styles.itemsHeaderCellSplit]}>
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
                <View style={[colAmt, styles.itemsBodyCell, styles.itemsBodyCellSplit]}>
                  <Text style={styles.tdR}>{fmt(line.taxableValue)}</Text>
                </View>
              </View>
            ))}

            <View style={[styles.blankFillRow, { height: lineItemsFillH }]} wrap={false}>
              <View style={[colSn, styles.itemsBodyCell]} />
              <View style={[colDesc, styles.itemsBodyDescCell]} />
              <View style={[colHsn, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
              <View style={[colQty, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
              <View style={[colUom, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
              <View style={[colRate, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
              <View style={[colAmt, styles.itemsBodyCell, styles.itemsBodyCellSplit]} />
            </View>
          </View>

          <View style={styles.taxThRow}>
            <View style={[{ width: "20%" }, styles.taxCellWrap]}>
              <Text style={[styles.th, { textAlign: "left" }]}>HSN Code</Text>
            </View>
            <View style={[{ width: "22%" }, styles.vline, styles.taxCellWrap]}>
              <Text style={[styles.th, { textAlign: "right" }]}>Taxable</Text>
            </View>
            <View style={[{ width: "12%" }, styles.vline, styles.taxCellWrap]}>
              <Text style={[styles.th, { textAlign: "center" }]}>
                {totals.taxMode === "IGST" ? "IGST %" : "GST %"}
              </Text>
            </View>
            <View style={[{ width: "22%" }, styles.vline, styles.taxCellWrap]}>
              <Text style={[styles.th, { textAlign: "right" }]}>
                {totals.taxMode === "IGST" ? "IGST Amt" : "CGST+SGST"}
              </Text>
            </View>
            <View style={[{ width: "24%" }, styles.vline, styles.taxCellWrap]}>
              <Text style={[styles.th, { textAlign: "right" }]}>Quantity</Text>
            </View>
          </View>
          {totals.hsnSummary.map((row) => (
            <View key={row.hsn} style={styles.tr} wrap={false}>
              <View style={[{ width: "20%" }, styles.taxCellWrap]}>
                <Text style={styles.tdL}>{row.hsn}</Text>
              </View>
              <View style={[{ width: "22%" }, styles.vline, styles.taxCellWrap]}>
                <Text style={styles.tdR}>{fmt(row.taxableValue)}</Text>
              </View>
              <View style={[{ width: "12%" }, styles.vline, styles.taxCellWrap]}>
                <Text style={styles.tdC}>{fmtPct(row.taxRatePercent)}</Text>
              </View>
              <View style={[{ width: "22%" }, styles.vline, styles.taxCellWrap]}>
                <Text style={styles.tdR}>
                  {totals.taxMode === "IGST"
                    ? fmt(row.igstAmount)
                    : `${fmt(row.cgstAmount)} + ${fmt(row.sgstAmount)}`}
                </Text>
              </View>
              <View style={[{ width: "24%" }, styles.vline, styles.taxCellWrap]}>
                <Text style={styles.tdR}>
                  {fmtQty(
                    totals.lines
                      .filter((l) => l.hsn === row.hsn)
                      .reduce((s, l) => s + l.quantity, 0),
                  )}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.totalsRow}>
            <View style={styles.totalsLeft} />
            <View style={styles.totalsRight}>
              <Text style={styles.totalsLabelCell}>Total</Text>
              <Text style={styles.totalsValueCell}>{fmt(totals.subtotalTaxable)}</Text>
            </View>
          </View>
          {totals.extraCharges > 0 ? (
            <View style={styles.totalsRowDivided}>
              <View style={styles.totalsLeft} />
              <View style={styles.totalsRight}>
                <Text style={styles.totalsLabelCell}>
                  {invoice.extraChargesLabel ?? "Other charges"}
                </Text>
                <Text style={styles.totalsValueCell}>{fmt(totals.extraCharges)}</Text>
              </View>
            </View>
          ) : null}
          {totals.taxMode === "IGST" ? (
            <View style={styles.totalsRowDivided}>
              <View style={styles.totalsLeft} />
              <View style={styles.totalsRight}>
                <Text style={styles.totalsLabelCell}>IGST Amount</Text>
                <Text style={styles.totalsValueCell}>{fmt(totals.igst)}</Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.totalsRowDivided}>
                <View style={styles.totalsLeft} />
                <View style={styles.totalsRight}>
                  <Text style={styles.totalsLabelCell}>CGST</Text>
                  <Text style={styles.totalsValueCell}>{fmt(totals.cgst)}</Text>
                </View>
              </View>
              <View style={styles.totalsRowDivided}>
                <View style={styles.totalsLeft} />
                <View style={styles.totalsRight}>
                  <Text style={styles.totalsLabelCell}>SGST</Text>
                  <Text style={styles.totalsValueCell}>{fmt(totals.sgst)}</Text>
                </View>
              </View>
            </>
          )}
          {totals.roundOff !== 0 ? (
            <View style={styles.totalsRowDivided}>
              <View style={styles.totalsLeft} />
              <View style={styles.totalsRight}>
                <Text style={styles.totalsLabelCell}>Round off</Text>
                <Text style={styles.totalsValueCell}>
                  {totals.roundOff < 0 ? "-" : "+"}
                  {fmt(Math.abs(totals.roundOff))}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.grandRow}>
            <View style={styles.grandLeft}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8 }}>
                Amount in words : -
              </Text>
              <Text style={{ fontSize: 8.5, marginTop: 2 }}>{amountWords}</Text>
            </View>
            <View style={styles.grandRight}>
              <Text style={styles.grandLabel}>GRAND TOTAL</Text>
              <Text style={styles.grandValue}>{fmt(totals.grandTotal)}</Text>
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
