import Counter from '../../models/Counter.js';
import Sale from '../../models/Sale.js';
import StockTransfer from '../../models/StockTransfer.js';
import StockCountSession from '../../models/StockCountSession.js';
import PurchaseOrder from '../../models/PurchaseOrder.js';

/**
 * Atomic counter generator for sequence numbers (Invoice, Transfer, StockCount, PurchaseOrder).
 * Scoped strictly to tenant (orgId) and optionally branchId.
 * Preserves backward compatibility by seeding from highest existing sequence number if counter does not exist yet.
 */
export const getNextSequenceNumber = async (orgId, key, options = {}) => {
  const { branchId = null, session = null, prefix = '', padLength = 6 } = options;
  const filter = { orgId, key, branchId };

  // Check if counter document exists for this orgId + key + branchId
  const existingCounter = await Counter.findOne(filter).session(session);

  if (!existingCounter) {
    // Seed counter sequence from highest existing document if available
    let seedSeq = 0;

    if (key === 'invoice') {
      const lastSale = await Sale.findOne({ orgId, invoiceNumber: /^INV-\d+$/ })
        .sort({ createdAt: -1 })
        .session(session)
        .lean();
      if (lastSale && lastSale.invoiceNumber) {
        const match = lastSale.invoiceNumber.match(/^INV-(\d+)$/);
        if (match && match[1]) seedSeq = parseInt(match[1], 10);
      }
    } else if (key === 'transfer') {
      const lastTransfer = await StockTransfer.findOne({ orgId, transferNumber: /^TRANSFER-\d+$/ })
        .sort({ createdAt: -1 })
        .session(session)
        .lean();
      if (lastTransfer && lastTransfer.transferNumber) {
        const match = lastTransfer.transferNumber.match(/^TRANSFER-(\d+)$/);
        if (match && match[1]) seedSeq = parseInt(match[1], 10);
      }
    } else if (key === 'stock_count') {
      const lastCount = await StockCountSession.findOne({ orgId, sessionNumber: /^COUNT-\d+$/ })
        .sort({ createdAt: -1 })
        .session(session)
        .lean();
      if (lastCount && lastCount.sessionNumber) {
        const match = lastCount.sessionNumber.match(/^COUNT-(\d+)$/);
        if (match && match[1]) seedSeq = parseInt(match[1], 10);
      }
    } else if (key === 'purchase_order') {
      const lastPo = await PurchaseOrder.findOne({ orgId, purchaseOrderNumber: /^PO-\d+$/ })
        .sort({ createdAt: -1 })
        .session(session)
        .lean();
      if (lastPo && lastPo.purchaseOrderNumber) {
        const match = lastPo.purchaseOrderNumber.match(/^PO-(\d+)$/);
        if (match && match[1]) seedSeq = parseInt(match[1], 10);
      }
    }

    try {
      await Counter.create(
        [{ orgId, key, branchId, seq: seedSeq }],
        { session }
      );
    } catch (err) {
      // E11000 duplicate key error means concurrent request initialized it; proceed to findOneAndUpdate
    }
  }

  // Atomically increment counter using findOneAndUpdate with $inc
  const updatedCounter = await Counter.findOneAndUpdate(
    filter,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, runValidators: true, session }
  );

  const seqStr = updatedCounter.seq.toString().padStart(padLength, '0');
  return prefix ? `${prefix}-${seqStr}` : seqStr;
};
