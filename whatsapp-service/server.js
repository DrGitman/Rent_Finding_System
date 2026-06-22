const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

// ─── State ────────────────────────────────────────────────────────────────────

let isReady = false;
let qrCodeData = null;          // raw QR string
let qrCodeImage = null;         // base64 PNG for /qr endpoint
let initError = null;

// Rolling message buffer: groupId → [{body, author, timestamp, groupName}]
const messageBuffer = new Map();
const MAX_MESSAGES_PER_GROUP = 500;

// Keywords that suggest a group is accommodation/rental-related.
// Checked against the group NAME (case-insensitive). Add your own local terms here.
const ACCOM_GROUP_KEYWORDS = [
  // English generic
  'rent', 'rental', 'rentals', 'to let', 'to-let', 'tolet',
  'flat', 'flats', 'room', 'rooms', 'house', 'houses', 'housing',
  'accommodation', 'accom', 'apartment', 'apartments', 'property', 'properties',
  'letting', 'lettings', 'tenant', 'landlord', 'bedsit', 'studio', 'lodge',
  'commune', 'commune',
  // SA-specific
  'huur', 'verhuur',       // Afrikaans rent/letting
  'kamer', 'kamers',       // Afrikaans room/rooms
  'woonstel',              // Afrikaans apartment
  'granny flat', 'wendy',  // common SA terms
  'bachelor', 'bachelors',
  'sectional', 'estate',
  'townhouse', 'cluster',
];

// ─── WhatsApp Client ──────────────────────────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '/app/session' }),
  puppeteer: {
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  },
});

client.on('qr', async (qr) => {
  qrCodeData = qr;
  isReady = false;
  qrcodeTerminal.generate(qr, { small: true });
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SCAN THIS QR CODE WITH WHATSAPP ON YOUR PHONE');
  console.log('  WhatsApp → Linked Devices → Link a Device');
  console.log('  Or visit http://localhost:3001/qr for a PNG image');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    qrCodeImage = await QRCode.toDataURL(qr);
  } catch (e) {
    console.error('Could not generate QR image:', e.message);
  }
});

client.on('authenticated', () => {
  console.log('WhatsApp authenticated successfully!');
  qrCodeData = null;
  qrCodeImage = null;
});

client.on('ready', () => {
  isReady = true;
  console.log('WhatsApp client is ready — now listening for messages in your groups.');
});

client.on('auth_failure', (msg) => {
  initError = msg;
  console.error('WhatsApp auth failure:', msg);
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.warn('WhatsApp disconnected:', reason);
});

// Buffer incoming messages — only from accommodation/rental groups, never DMs
client.on('message', async (message) => {
  try {
    const chat = await message.getChat();
    if (!chat.isGroup) return;                          // skip all DMs & personal chats
    if (!isAccommodationGroup(chat.name)) return;       // skip non-rental groups

    const groupId = chat.id._serialized;
    if (!messageBuffer.has(groupId)) {
      messageBuffer.set(groupId, []);
    }
    const buf = messageBuffer.get(groupId);
    buf.push({
      id: message.id._serialized,
      body: message.body || '',
      author: message.author || message.from,
      timestamp: message.timestamp,
      groupName: chat.name,
      groupId,
    });
    if (buf.length > MAX_MESSAGES_PER_GROUP) buf.shift();
  } catch (e) {
    // silently ignore errors per message
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAccommodationGroup(groupName) {
  const lower = groupName.toLowerCase();
  return ACCOM_GROUP_KEYWORDS.some(k => lower.includes(k));
}

function extractListingFromText(body, groupName, groupId, author, timestamp) {
  const priceMatch = body.match(/[R$£€]\s*([\d\s,]+)(?:\s*(?:pm|pcm|p\.?m\.?|\/mo(?:nth)?|per month|per\s+month))?/i);
  const bedsMatch  = body.match(/(\d)\s*(?:bed(?:room)?s?|bd|br)/i);
  const bathsMatch = body.match(/(\d)\s*(?:bath(?:room)?s?|ba)/i);

  const price = priceMatch
    ? parseInt(priceMatch[1].replace(/[\s,]/g, ''), 10)
    : null;

  return {
    source: 'whatsapp_group',
    title: body.substring(0, 120).replace(/\n/g, ' '),
    description: body,
    price,
    beds: bedsMatch  ? parseInt(bedsMatch[1], 10) : null,
    baths: bathsMatch ? parseInt(bathsMatch[1], 10) : null,
    address: null,
    group_name: groupName,
    group_id: groupId,
    sender_phone: author,
    posted_at: new Date(timestamp * 1000).toISOString(),
    message_id: null,
    confidence: price && bedsMatch ? 0.85 : price ? 0.7 : 0.5,
  };
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', whatsapp_ready: isReady });
});

app.get('/status', (_req, res) => {
  res.json({
    ready: isReady,
    qr_pending: !isReady && !!qrCodeData,
    error: initError,
  });
});

// Serve QR code as an HTML page with auto-refresh
app.get('/qr', (_req, res) => {
  if (isReady) {
    return res.send('<h2 style="font-family:sans-serif;color:green">✓ WhatsApp is already connected!</h2>');
  }
  if (!qrCodeImage) {
    return res.send(`
      <html><head><meta http-equiv="refresh" content="3"></head>
      <body style="font-family:sans-serif">
        <h2>Waiting for QR code...</h2>
        <p>This page refreshes automatically every 3 seconds.</p>
      </body></html>
    `);
  }
  res.send(`
    <html><head><meta http-equiv="refresh" content="30"></head>
    <body style="font-family:sans-serif;text-align:center;padding:40px">
      <h2>Scan this QR code with WhatsApp</h2>
      <p>WhatsApp → Linked Devices → Link a Device</p>
      <img src="${qrCodeImage}" style="width:280px;height:280px" />
      <p style="color:#888;font-size:13px">QR refreshes every 20 seconds. Page auto-refreshes every 30s.</p>
    </body></html>
  `);
});

// List all groups the user is in
app.get('/groups', async (_req, res) => {
  if (!isReady) return res.status(503).json({ error: 'WhatsApp not ready. Scan QR code first at /qr' });
  try {
    const chats = await client.getChats();
    const groups = chats
      .filter(c => c.isGroup)
      .map(g => ({
        id: g.id._serialized,
        name: g.name,
        participants: g.participants ? g.participants.length : 0,
        is_accommodation: isAccommodationGroup(g.name),
      }))
      .sort((a, b) => b.is_accommodation - a.is_accommodation);
    res.json({ groups, count: groups.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /search
 * Body: {
 *   keywords: string[]        — words to match in message text   (default: rent/flat/room/accommodation)
 *   days_back: number         — how many days back to search     (default: 7)
 *   accommodation_only: bool  — only search accommodation groups (default: false)
 * }
 */
app.post('/search', async (req, res) => {
  if (!isReady) return res.status(503).json({ error: 'WhatsApp not ready. Scan QR code first at /qr' });

  const {
    keywords = ['rent', 'flat', 'room', 'house', 'accommodation', 'apartment', 'available', 'letting'],
    days_back = 7,
    accommodation_only = true,   // always restrict to rental/accommodation groups by default
  } = req.body;

  const cutoffTimestamp = Math.floor(Date.now() / 1000) - days_back * 86400;

  try {
    const chats = await client.getChats();
    const groups = chats.filter(c => c.isGroup);

    const listings = [];
    const keywordsLower = keywords.map(k => k.toLowerCase());

    for (const group of groups) {
      const isAccomGroup = isAccommodationGroup(group.name);
      if (accommodation_only && !isAccomGroup) continue;

      // First check buffered messages (fast)
      const buffered = messageBuffer.get(group.id._serialized) || [];
      const recentBuffered = buffered.filter(m => m.timestamp >= cutoffTimestamp);

      // If no buffered messages, fetch from WhatsApp directly
      let messages = recentBuffered;
      if (messages.length === 0) {
        try {
          const fetched = await group.fetchMessages({ limit: 100 });
          messages = fetched
            .filter(m => m.timestamp >= cutoffTimestamp && m.body)
            .map(m => ({
              body: m.body,
              author: m.author || m.from,
              timestamp: m.timestamp,
              groupName: group.name,
              groupId: group.id._serialized,
            }));
        } catch (e) {
          console.warn(`Could not fetch messages from "${group.name}": ${e.message}`);
          continue;
        }
      }

      for (const msg of messages) {
        const bodyLower = msg.body.toLowerCase();
        const matchesKeyword = keywordsLower.some(k => bodyLower.includes(k));

        // Include if: keyword match in any group, OR any message in an accommodation group
        if (matchesKeyword || isAccomGroup) {
          listings.push(extractListingFromText(
            msg.body, msg.groupName, msg.groupId, msg.author, msg.timestamp
          ));
        }
      }
    }

    // Sort by confidence desc, then by posted_at desc
    listings.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return new Date(b.posted_at) - new Date(a.posted_at);
    });

    res.json({ listings, count: listings.length });
  } catch (e) {
    console.error('Search error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\nRentScout WhatsApp Service started on port ${PORT}`);
  console.log('Initializing WhatsApp client — please wait...\n');
});

client.initialize().catch(err => {
  initError = err.message;
  console.error('WhatsApp client initialization failed:', err.message);
});
