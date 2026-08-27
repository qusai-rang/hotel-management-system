async function main() {
  try {
    await import('dotenv/config');
    const { default: mongoose } = await import('mongoose');

    await mongoose.connect(process.env.MONGODB_URI);

    const db = mongoose.connection.db;
    const collection = db.collection('__luxestay_probe');

    const inserted = await collection.insertOne({
      probe: true,
      createdAt: new Date(),
    });

    console.log('insert:', inserted.acknowledged);

    const updated = await collection.updateOne(
      { _id: inserted.insertedId },
      { $set: { updated: true } },
    );

    console.log('update:', updated.acknowledged, updated.modifiedCount);

    const deleted = await collection.deleteOne({
      _id: inserted.insertedId,
    });

    console.log('delete:', deleted.acknowledged, deleted.deletedCount);

    await mongoose.disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}

main();
