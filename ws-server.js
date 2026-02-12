const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.WS_PORT || 63007;
const server = http.createServer();
const wss = new WebSocketServer({ server });

const rooms = new Map();

function makeCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoom(client) {
  let code = makeCode();
  while (rooms.has(code)) code = makeCode();
  rooms.set(code, {
    code,
    clients: [client],
    ready: [false, false],
    turn: 1,
  });
  client.meta = { roomCode: code, playerIndex: 0 };
  send(client, { type: 'room_created', code, playerIndex: 0 });
}

function joinRoom(client, code) {
  const room = rooms.get(code);
  if (!room) {
    send(client, { type: 'error', message: 'Комната не найдена' });
    return;
  }
  if (room.clients.length >= 2) {
    send(client, { type: 'error', message: 'Комната заполнена' });
    return;
  }
  room.clients.push(client);
  client.meta = { roomCode: code, playerIndex: 1 };
  send(client, { type: 'room_joined', code, playerIndex: 1 });
  send(room.clients[0], { type: 'opponent_joined', code });
}

function autoMatch(client) {
  const waitingRoom = [...rooms.values()].find(r => r.clients.length === 1);
  if (waitingRoom) {
    joinRoom(client, waitingRoom.code);
  } else {
    createRoom(client);
  }
}

function listRooms(client) {
  const list = [...rooms.values()]
    .filter(r => r.clients.length < 2)
    .map(r => ({ code: r.code, count: r.clients.length }));
  send(client, { type: 'room_list', rooms: list });
}

function leaveRoom(client) {
  const meta = client.meta;
  if (!meta || !meta.roomCode) return;
  const room = rooms.get(meta.roomCode);
  if (!room) return;
  room.clients = room.clients.filter(c => c !== client);
  if (room.clients.length === 0) {
    rooms.delete(room.code);
  } else {
    send(room.clients[0], { type: 'opponent_left' });
    room.ready = [false, false];
  }
  client.meta = {};
}

function handleReady(client) {
  const meta = client.meta;
  if (!meta || !meta.roomCode) return;
  const room = rooms.get(meta.roomCode);
  if (!room) return;
  room.ready[meta.playerIndex] = true;
  const opponent = room.clients.find(c => c !== client);
  if (opponent) send(opponent, { type: 'opponent_ready' });
  if (room.clients.length === 2 && room.ready[0] && room.ready[1]) {
    room.turn = 1;
    broadcast(room, { type: 'start_battle', currentPlayer: 1 });
  }
}

function handleShot(client, row, col) {
  const meta = client.meta;
  if (!meta || !meta.roomCode) return;
  const room = rooms.get(meta.roomCode);
  if (!room) return;
  if (room.turn !== meta.playerIndex + 1) {
    send(client, { type: 'error', message: 'Сейчас ход соперника' });
    return;
  }
  const opponent = room.clients.find(c => c !== client);
  if (!opponent) return;
  send(opponent, { type: 'incoming_shot', row, col, attackerIndex: meta.playerIndex });
}

function handleShotResult(client, row, col, result, win) {
  const meta = client.meta;
  if (!meta || !meta.roomCode) return;
  const room = rooms.get(meta.roomCode);
  if (!room) return;
  const attackerIndex = meta.playerIndex === 0 ? 1 : 0;
  const attacker = room.clients.find(c => c.meta && c.meta.playerIndex === attackerIndex);
  if (attacker) send(attacker, { type: 'shot_result', row, col, result, attackerIndex, win });
  if (result === 'miss') {
    room.turn = meta.playerIndex + 1;
  }
  if (result !== 'miss') {
    room.turn = attackerIndex + 1;
  }
  broadcast(room, { type: 'turn', currentPlayer: room.turn });
  if (win) {
    room.ready = [false, false];
  }
}

function send(client, payload) {
  if (client.readyState === 1) client.send(JSON.stringify(payload));
}

function broadcast(room, payload) {
  room.clients.forEach(client => send(client, payload));
}

wss.on('connection', (ws) => {
  ws.meta = {};

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (!msg || !msg.type) return;

    if (msg.type === 'create_room') return createRoom(ws);
    if (msg.type === 'join_room') return joinRoom(ws, String(msg.code || '').trim().toUpperCase());
    if (msg.type === 'auto_match') return autoMatch(ws);
    if (msg.type === 'list_rooms') return listRooms(ws);
    if (msg.type === 'leave_room') return leaveRoom(ws);
    if (msg.type === 'ready') return handleReady(ws);
    if (msg.type === 'shot') return handleShot(ws, msg.row, msg.col);
    if (msg.type === 'shot_result') return handleShotResult(ws, msg.row, msg.col, msg.result, msg.win);
  });

  ws.on('close', () => {
    leaveRoom(ws);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WS server listening on ${PORT}`);
});
