import mongoose from 'mongoose';

let isTransactionSupported = null;

/**
 * Probe MongoDB deployment to check if multi-document transactions are supported (Replica Set / mongos / Atlas).
 * Standalone mongod instances without replica set throw IllegalOperation (code 20).
 */
export const checkTransactionSupport = async () => {
  if (isTransactionSupported !== null) return isTransactionSupported;

  try {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      // Perform a light query with session to probe MongoDB engine transaction capability
      await mongoose.connection.db.command({ ping: 1 }, { session });
      await session.abortTransaction();
      isTransactionSupported = true;
    } catch (err) {
      isTransactionSupported = false;
    } finally {
      await session.endSession();
    }
  } catch (err) {
    isTransactionSupported = false;
  }

  return isTransactionSupported;
};

/**
 * Execute work inside a Mongoose transaction if supported by deployment.
 * If standalone MongoDB (no Replica Set), executes workFn cleanly with session=null.
 */
export const executeTransaction = async (workFn) => {
  const supportsTx = await checkTransactionSupport();

  if (supportsTx) {
    const session = await mongoose.startSession();
    try {
      let result = null;
      await session.withTransaction(async () => {
        result = await workFn(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  } else {
    // Standalone MongoDB deployment (e.g. local standalone mongod)
    return await workFn(null);
  }
};
