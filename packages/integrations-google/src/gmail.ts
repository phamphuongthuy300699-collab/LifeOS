import { google, gmail_v1 } from 'googleapis';

export interface GmailMessageMetadata {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  from: { name?: string; email: string };
  to: Array<{ name?: string; email: string }>;
  cc: Array<{ name?: string; email: string }>;
  labels: string[];
  sentAt: Date;
  isUnread: boolean;
  hasAttachments: boolean;
  webUrl: string;
}

/**
 * Initialize a Gmail client using an OAuth access token.
 */
function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

/**
 * Parses the "Name <email@domain.com>" format.
 */
function parseEmailAddress(raw: string): { name?: string; email: string } {
  const match = raw.match(/(.*)<(.*)>/);
  if (match?.[1] && match?.[2]) {
    const name = match[1].trim().replace(/^"|"$/g, '');
    return { name: name || undefined, email: match[2].trim() };
  }
  return { email: raw.trim() };
}

function parseMultipleAddresses(raw: string): Array<{ name?: string; email: string }> {
  if (!raw) return [];
  // Basic split by comma. Note: Real email parsing is harder if names contain commas,
  // but this suffices for MVP.
  return raw.split(',').map((addr) => parseEmailAddress(addr));
}

/**
 * Extracts metadata from a gmail message payload
 */
function extractMetadata(message: gmail_v1.Schema$Message): GmailMessageMetadata {
  const headers = message.payload?.headers || [];
  
  const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

  const subject = getHeader('subject');
  const fromRaw = getHeader('from');
  const toRaw = getHeader('to');
  const ccRaw = getHeader('cc');
  const dateRaw = getHeader('date');

  const from = parseEmailAddress(fromRaw);
  const to = parseMultipleAddresses(toRaw);
  const cc = parseMultipleAddresses(ccRaw);
  const sentAt = dateRaw ? new Date(dateRaw) : new Date(Number(message.internalDate));

  const labels = message.labelIds || [];
  const isUnread = labels.includes('UNREAD');
  
  // Basic heuristic for attachments
  const hasAttachments = !!message.payload?.parts?.some((part) => part.filename && part.filename.length > 0);

  return {
    id: message.id!,
    threadId: message.threadId!,
    subject,
    snippet: message.snippet || '',
    from,
    to,
    cc,
    labels,
    sentAt,
    isUnread,
    hasAttachments,
    webUrl: `https://mail.google.com/mail/u/0/#inbox/${message.threadId}`,
  };
}

/**
 * Fetch recent message metadata (Inbox only, to avoid pulling spam/trash).
 */
export async function getRecentMessagesMetadata(
  accessToken: string,
  limit: number = 20,
  query: string = 'in:inbox'
): Promise<GmailMessageMetadata[]> {
  const gmail = getGmailClient(accessToken);
  
  // 1. List messages
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults: limit,
    q: query,
  });

  const messages = listRes.data.messages || [];
  if (messages.length === 0) {
    return [];
  }

  // 2. Fetch metadata for each message.
  // Note: For MVP, we do sequential or parallel fetching. Parallel is faster.
  const metadataPromises = messages.map(async (msg) => {
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Cc', 'Subject', 'Date'],
    });
    return extractMetadata(res.data);
  });

  return Promise.all(metadataPromises);
}

/**
 * Fetches the full message body (Text and HTML).
 */
export async function getMessageBody(accessToken: string, messageId: string): Promise<{ text: string; html: string }> {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  let text = '';
  let html = '';

  const parts = res.data.payload?.parts;
  
  function decodeBase64Url(str: string) {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  // Simplified part extractor for MVP
  if (parts) {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = decodeBase64Url(part.body.data);
      }
    }
  } else if (res.data.payload?.body?.data) {
    // If it's not multipart
    if (res.data.payload.mimeType === 'text/html') {
      html = decodeBase64Url(res.data.payload.body.data);
    } else {
      text = decodeBase64Url(res.data.payload.body.data);
    }
  }

  return { text, html };
}
