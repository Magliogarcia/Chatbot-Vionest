import { ObjectId } from 'mongodb';
import { getConversationsCollection } from '../db/mongo.js';

export async function createConversation(userId, initialTitle = 'Nueva conversación') {
  const col = getConversationsCollection();
  const newConv = {
    userId: userId.toString(),
    title: initialTitle.slice(0, 50),
    currentClientContext: null, // { clientId: string, clientName: string, pendingMatches?: [] }
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await col.insertOne(newConv);
  return {
    _id: result.insertedId.toString(),
    ...newConv
  };
}

export async function listUserConversations(userId) {
  const col = getConversationsCollection();
  const convs = await col.find(
    { userId: userId.toString() },
    {
      projection: {
        _id: 1,
        title: 1,
        updatedAt: 1,
        createdAt: 1,
        messageCount: { $size: '$messages' }
      }
    }
  )
  .sort({ updatedAt: -1 })
  .toArray();

  return convs.map(c => ({
    id: c._id.toString(),
    title: c.title,
    updatedAt: c.updatedAt,
    createdAt: c.createdAt,
    messageCount: c.messageCount
  }));
}

export async function getUserConversationById(conversationId, userId) {
  const col = getConversationsCollection();
  let queryId;
  try {
    queryId = new ObjectId(conversationId);
  } catch {
    return null;
  }

  // Estricto aislamiento: solo busca si coincide el id Y el userId
  const conv = await col.findOne({
    _id: queryId,
    userId: userId.toString()
  });

  if (!conv) return null;

  return {
    id: conv._id.toString(),
    title: conv.title,
    currentClientContext: conv.currentClientContext,
    messages: conv.messages || [],
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt
  };
}

export async function deleteUserConversation(conversationId, userId) {
  const col = getConversationsCollection();
  let queryId;
  try {
    queryId = new ObjectId(conversationId);
  } catch {
    return false;
  }

  const result = await col.deleteOne({
    _id: queryId,
    userId: userId.toString()
  });

  return result.deletedCount > 0;
}

export async function addMessageToConversation(conversationId, userId, messageObj, updatedContext = undefined) {
  const col = getConversationsCollection();
  let queryId;
  try {
    queryId = new ObjectId(conversationId);
  } catch {
    return false;
  }

  const updateDoc = {
    $push: { messages: messageObj },
    $set: { updatedAt: new Date() }
  };

  if (updatedContext !== undefined) {
    updateDoc.$set.currentClientContext = updatedContext;
  }

  const result = await col.updateOne(
    { _id: queryId, userId: userId.toString() },
    updateDoc
  );

  return result.modifiedCount > 0;
}

export async function updateConversationTitle(conversationId, userId, newTitle) {
  const col = getConversationsCollection();
  let queryId;
  try {
    queryId = new ObjectId(conversationId);
  } catch {
    return false;
  }

  await col.updateOne(
    { _id: queryId, userId: userId.toString() },
    { $set: { title: newTitle.slice(0, 50), updatedAt: new Date() } }
  );
  return true;
}
