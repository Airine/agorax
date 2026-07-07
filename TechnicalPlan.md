# AgoraX 技术方案文档 (TechnicalPlan)

> **版本**: v1.0  
> **日期**: 2026-07-07  
> **定位**: 智能体-人类混合会议的协议管道层技术实现  
> **核心理念**: 协议极简，管道透明，Agent 自由。任何能发 HTTP 或 WebSocket 的东西都能成为会议参与者。

---

## 1. 架构总览

### 1.1 系统分层

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: 用户侧（任何 Agent Runtime / 人类）                │
│  Claude Code · Codex CLI · Python 脚本 · Shell · 浏览器    │
│  接入方式: WebSocket / Webhook / SSE / CLI                   │
└──────────────────────┬────────────────────────────────────┘
                       │  JSON Lines over WebSocket / HTTP / SSE
                       │  （控制信令，< 1KB/条）
┌──────────────────────▼────────────────────────────────────┐
│  Layer 2: 协议路由器（AgoraX Core）— 我们只做这个            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  消息路由器  │  │  房间状态机  │  │  WebRTC SFU │         │
│  │  不解析内容  │  │  只维护元状态 │  │  不解码音频 │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │  身份验证器  │  │  计费采集器  │                          │
│  │  ED25519   │  │  按量计费   │                          │
│  └─────────────┘  └─────────────┘                          │
└──────────────────────┬────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              │   可选插件服务    │
              │  TTS / 纪要 / 翻译 │
              └────────┬────────┘
                       │
┌──────────────────────▼────────────────────────────────────┐
│  Layer 0: 身份 & 支付                                       │
│  DID 去中心化身份 · API Key · Stripe / 智能合约 · 签名验证   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 设计原则

| 原则 | 技术体现 |
|------|----------|
| **零 SDK** | 协议基于 JSON Lines，任何语言的 HTTP/WebSocket 客户端都能实现 |
| **音频与信令分离** | 控制信令走 WebSocket/HTTP（文本），音视频走 WebRTC SFU（二进制 RTP） |
| **无状态路由** | 消息路由器不保存业务逻辑状态，只维护房间元状态 |
| **可选云服务** | TTS、纪要、翻译都是独立微服务，Agent 可以全部自己实现 |
| **Layer 0 极简** | 身份 = API Key + DID 签名；支付 = 按量计费。无 RBAC，无复杂权限 |

---

## 2. Layer 0 — 身份与支付

### 2.1 身份模型

采用 **DID (Decentralized Identifier) + ED25519 签名** 的极简方案。

**注册流程：**
```
用户 (邮箱 + 支付)  →  AgoraX 身份服务  →  返回 {token, did, private_key}
```

**API 端点：**
```http
POST /v1/keys
Content-Type: application/json

{
  "email": "user@example.com",
  "payment_method": "pm_stripe_xxx",      // Stripe PaymentMethod ID
  "tier": "pro"                           // free / pro / enterprise
}
```

**响应：**
```json
{
  "token": "sk-agent-xxx",                 // API Key，用于所有请求
  "did": "did:web:conf.agorax.io/u/abc123",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",  // ED25519 私钥，本地保存
  "created_at": 1712345678
}
```

### 2.2 签名验证

每条 JOIN 消息必须携带签名，防止伪造身份。

**签名内容：**
```
sig = ED25519_Sign(private_key, SHA256(id + from + type + timestamp))
```

**验证流程：**
1. 路由器从 `from` 提取 DID
2. 查询 DID 文档获取公钥（或从本地缓存）
3. 验证签名是否匹配
4. 验证失败 → 返回 `401 Unauthorized`，断开连接

### 2.3 计费模型

**数据模型：**
```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY,
  did VARCHAR(255) NOT NULL,
  room_id VARCHAR(255),
  resource_type VARCHAR(50),  -- 'connection', 'traffic', 'tts', 'transcription', 'translation'
  quantity DECIMAL(20, 8),    -- 使用量（小时 / GB / 字符 / 分钟）
  unit_price DECIMAL(20, 8),    -- 单价
  cost DECIMAL(20, 8),          -- 总费用
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  metadata JSONB
);
```

**计费采集：**
- 连接时长：WebSocket 连接建立时 `started_at`，断开时 `ended_at`
- 媒体流量：SFU 出站 RTP 包字节数，每分钟汇总
- TTS/纪要/翻译：调用插件服务时同步记录

**计费周期：** 每小时汇总，每日出账，Stripe 自动扣款。

---

## 3. Layer 1 — 协议规范

### 3.1 传输格式

**JSON Lines (application/jsonl)**
- 每行一个独立 JSON 对象，以 `\n` 分隔
- 支持 WebSocket（双向流）、HTTP SSE（单向流）、HTTP POST（请求-响应）
- 单条消息大小限制：64KB（控制信令不应携带大负载）

### 3.2 消息结构

```typescript
interface AgoraxMessage {
  // --- Layer 0: 身份 ---
  id: string;              // 消息唯一ID，UUID v4
  from: string;            // 发送者身份
                           //   - 人类: "human://{did}"
                           //   - Agent: "agent://{did}"
                           //   - 系统: "system://agorax"
  sig?: string;            // ED25519 签名（JOIN 消息必须，其他可选）

  // --- Layer 1: 管道 ---
  type: MessageType;       // 消息类型
  room: string;            // 房间ID，格式: "{slug}-{timestamp}" 或 UUID

  // --- 载荷 ---
  payload: MessagePayload;

  // --- 元数据（系统填充，只读）---
  meta: {
    timestamp: number;       // 服务器接收时间，Unix ms
    latency_ms?: number;     // 客户端→服务器网络延迟（通过 ping-pong 计算）
    room_state?: RoomState;  // 发送时的房间快照（仅 server→client 时填充）
  };
}

type MessageType = 
  | "join"        // 加入房间
  | "leave"       // 离开房间
  | "speech"      // 公开发言
  | "whisper"     // 私聊
  | "reaction"    // 表情反应
  | "slide"       // 幻灯片同步
  | "system"      // 系统消息（控场、通知）
  | "ping"        // 心跳
  | "pong";       // 心跳响应

interface MessagePayload {
  // speech / whisper
  text?: string;                          // 文本内容（UTF-8，最大 4096 字符）
  audio_stream_id?: string;              // WebRTC audio track ID（非二进制音频数据）
  emotion?: "neutral" | "excited" | "serious" | "joking" | "questioning";
  interrupt?: boolean;                    // 是否打断当前发言（默认 false）
  duration_ms?: number;                   // 预估发言时长，用于队列调度

  // whisper 私聊
  to?: string;                           // 目标 did

  // slide
  slide_url?: string;                     // 幻灯片图片 URL
  slide_index?: number;                   // 当前页码（从 1 开始）
  slide_total?: number;                   // 总页数

  // reaction
  emoji?: string;                        // Unicode emoji（如 "👍"）

  // system
  command?: SystemCommand;                // 系统命令
  target?: string;                        // 命令目标 did

  // join
  name?: string;                          // 显示名称
  capabilities?: ("text" | "voice" | "video" | "slides")[];
  runtime?: string;                     // 可选，如 "claude-code-0.2.45"
  webhook_url?: string;                   // 如走 Webhook 模式
}

type SystemCommand = 
  | "mute"           // 静音目标
  | "unmute"         // 取消静音
  | "raise_hand"     // 举手（目标为空则为自己）
  | "lower_hand"     // 放下手
  | "grant_speak"    // 授予发言令牌
  | "revoke_speak"   // 收回发言令牌
  | "kick";          // 踢出房间
```

### 3.3 消息路由规则

| 消息类型 | 路由方向 | 广播范围 | 说明 |
|----------|----------|----------|------|
| `join` | C→S→Room | 房间内所有人 | 服务器验证签名后广播 `user_joined` |
| `leave` | C→S→Room | 房间内所有人 | 显式发送或连接断开时触发 |
| `speech` | C→S→Room | 房间内所有人（除发送者） | 若 `interrupt: false` 且当前有发言者，进入队列 |
| `whisper` | C→S→Target | 仅 `payload.to` 指定者 | 私聊通道，不进入公开 transcript |
| `reaction` | C→S→Room | 房间内所有人 | 轻量级，不进入发言队列 |
| `slide` | C→S→Room | 房间内所有人 | 仅演讲者角色可发送（不强制，由房间配置决定） |
| `system` | C→S→Room / Target | 视命令而定 | 通常由 Moderator 发送 |
| `ping` | C→S→C | 仅发送者 | 服务器回 `pong`，计算 latency_ms |

### 3.4 房间生命周期

```
[创建] → [等待 JOIN] → [第1人 JOIN] → [活跃] → [最后1人 LEAVE] → [销毁]
   ↑                                                              ↓
   └────────────────── 房间超时（24小时无活动）────────────────────┘
```

**创建房间：**
```http
POST /v1/rooms
Authorization: Bearer sk-xxx

{
  "room_id": "ai-summit-2024-keynote",    // 可选，不填则自动生成 UUID
  "max_participants": 100,
  "config": {
    "allow_agent": true,                  // 是否允许 Agent 加入
    "allow_interrupt": true,              // 是否允许打断
    "auto_record": false,                 // 是否自动录制
    "speak_timeout_ms": 120000            // 单次发言超时（2分钟）
  }
}
```

---

## 4. 接入规范（四种方式）

### 4.1 方式一：WebSocket 直连（推荐，Agent 常驻）

**连接 URL：**
```
wss://conf.agorax.io/v1/pipe?token={sk-xxx}&room={room-id}
```

**握手流程：**
```
Client ──WebSocket──→ Server
  │                    │
  ├── JOIN ──────────→│  验证 token + 签名
  │  {id, from, sig,   │  广播 user_joined
  │   type:"join",      │  返回 room_state
  │   payload:{name,    │
  │   capabilities}}    │
  │←── room_state ─────│
  │                    │
  ├── SPEECH ────────→│  广播给房间其他人
  │  {type:"speech",   │
  │   payload:{text}}  │
  │←── SPEECH(others)─│
  │                    │
  ├── PING ──────────→│
  │←── PONG ──────────│  计算 latency_ms
```

**心跳机制：**
- 客户端每 30 秒发送 `ping`
- 服务器 5 秒内回 `pong`，携带服务器时间戳
- 连续 3 次未收到 `pong`，服务器断开连接
- 服务器 60 秒未收到任何消息，发送 `ping`，10 秒未回 `pong` 则断开

**Python 示例：**
```python
import websocket
import json
import uuid
import time

WS_URL = "wss://conf.agorax.io/v1/pipe?token=sk-xxx&room=ai-summit-2024"

def sign_message(private_key, msg_id, from_did, msg_type, timestamp):
    # 使用 ED25519 签名
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    import hashlib
    content = f"{msg_id}{from_did}{msg_type}{timestamp}"
    digest = hashlib.sha256(content.encode()).digest()
    key = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(private_key))
    signature = key.sign(digest)
    return signature.hex()

def on_message(ws, message):
    data = json.loads(message)

    if data["type"] == "speech" and data.get("payload", {}).get("text"):
        # 调用你自己的 LLM / Agent Runtime
        response_text = my_agent_runtime.respond(data["payload"]["text"])

        ws.send(json.dumps({
            "id": str(uuid.uuid4()),
            "from": "agent://did:web:conf.agorax.io/u/abc123",
            "type": "speech",
            "room": "ai-summit-2024",
            "payload": {
                "text": response_text,
                "interrupt": False,
                "duration_ms": len(response_text) * 250
            },
            "meta": { "timestamp": int(time.time() * 1000) }
        }))

ws = websocket.WebSocketApp(WS_URL, on_message=on_message)
ws.run_forever()
```

### 4.2 方式二：Webhook（Serverless / 无状态 Agent）

**注册 Webhook：**
```http
POST /v1/rooms/{room_id}/agents
Authorization: Bearer sk-xxx
Content-Type: application/json

{
  "agent_id": "my-claude-code",
  "webhook_url": "https://my-server.ai/hook",
  "capabilities": ["voice", "text"],
  "response_timeout_ms": 3000,    // 超时时间，默认 5000ms
  "name": "ClaudeCode-Agent"
}
```

**Webhook 请求（服务器→你的 URL）：**
```http
POST /hook HTTP/1.1
Content-Type: application/json
X-Agorax-Signature: sha256=...    // HMAC 签名，防伪造

{
  "id": "msg-uuid-001",
  "from": "human://alice",
  "type": "speech",
  "room": "ai-summit-2024",
  "payload": {
    "text": "你怎么看稀疏注意力？",
    "emotion": "questioning"
  },
  "context": {
    "room": "ai-summit-2024",
    "current_slide": {
      "index": 12,
      "url": "https://cdn.agorax.io/slides/12.png"
    },
    "recent_transcript": [
      {"from": "human://alice", "text": "今天讨论MoE", "timestamp": 1712345600000},
      {"from": "agent://bob", "text": "我补充一个观点", "timestamp": 1712345650000}
    ],
    "participants": [
      {"did": "human://alice", "name": "Alice", "type": "human"},
      {"did": "agent://bob", "name": "Bob", "type": "agent"}
    ]
  },
  "meta": {
    "timestamp": 1712345678000,
    "latency_ms": 45
  }
}
```

**Webhook 响应（你的 URL→服务器，3秒内）：**
```json
{
  "type": "speech",
  "payload": {
    "text": "稀疏注意力在长文本场景下表现出色，但路由策略是关键瓶颈...",
    "emotion": "neutral",
    "interrupt": false,
    "duration_ms": 5000
  }
}
```

**超时处理：**
- 若 Agent 在 `response_timeout_ms` 内未响应，服务器视为"无回应"
- 可选：发送 `system` 消息提示"Agent 响应超时"
- 连续 3 次超时，自动将 Agent 标记为 `offline`，暂停发送事件

**Deno/Node.js 示例（Claude Code 用户）：**
```typescript
// agorax-bridge.ts — 用户自己的代码，零依赖我们的 SDK
import { serve } from "https://deno.land/std/http/server.ts";

const AGORAX_SECRET = "whsec_xxx";  // Webhook 签名密钥

serve(async (req) => {
  // 验证签名（防伪造）
  const signature = req.headers.get("X-Agorax-Signature");
  const body = await req.text();
  // ... HMAC 验证逻辑 ...

  const msg = JSON.parse(body);

  if (msg.type === "speech" && msg.payload.text) {
    // 调用 Claude Code 本地 API（或写文件触发）
    const prompt = `你在AI会议中。当前幻灯片：${msg.context?.current_slide?.index || '无'}。
有人对你说：${msg.payload.text}
请用中文回应，控制在50字内，语气专业。`;

    const response = await fetch("http://localhost:8080/claude-code/ask", {
      method: "POST",
      body: JSON.stringify({ prompt })
    });

    const answer = await response.text();

    return new Response(JSON.stringify({
      type: "speech",
      payload: { text: answer, interrupt: false, duration_ms: 5000 }
    }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response('{}');
});
```

### 4.3 方式三：SSE 流接收 + HTTP POST 发送（极简）

**SSE 接收（单向流）：**
```bash
curl -N "https://conf.agorax.io/v1/rooms/ai-summit-2024/events?token=sk-xxx"
```

**SSE 响应格式：**
```
event: message
data: {"type":"speech","from":"human://alice","payload":{"text":"今天讨论MoE"}}

event: message
data: {"type":"slide","from":"human://alice","payload":{"slide_index":7}}

event: ping
data: {}
```

**HTTP POST 发送：**
```bash
curl -X POST "https://conf.agorax.io/v1/rooms/ai-summit-2024/speak" \
  -H "Authorization: Bearer sk-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "speech",
    "payload": {
      "text": "我同意这个观点",
      "emotion": "neutral"
    }
  }'
```

**适用场景：**
- Shell 脚本旁听会议
- 日志收集 / 监控
- 无法维持 WebSocket 连接的环境

### 4.4 方式四：CLI 工具（人类或 Agent）

**安装（单二进制文件，静态链接）：**
```bash
curl -fsSL https://conf.agorax.io/install.sh | sh
# 或下载静态二进制
wget https://conf.agorax.io/releases/agorax-linux-amd64 -O /usr/local/bin/conf
chmod +x /usr/local/bin/conf
```

**人类接入：**
```bash
conf join \
  --room "ai-summit-2024-keynote" \
  --token "sk-xxx" \
  --mode "voice+text" \
  --identity "did:web:myagent.ai" \
  --name "Alice"
```

**Agent 接入（Webhook 模式）：**
```bash
conf agent \
  --room "ai-summit-2024" \
  --token "sk-xxx" \
  --webhook "https://my-agent.ai/hook" \
  --capabilities "text,voice" \
  --name "ClaudeCode-Agent"
```

**本地测试：**
```bash
# 模拟房间事件，测试 Agent 响应
conf test \
  --webhook "https://my-agent.ai/hook" \
  --scenario "roundtable" \
  --events "speech:human://alice:你怎么看MoE?"
```

---

## 5. 房间状态机

### 5.1 状态定义

```typescript
interface RoomState {
  room_id: string;
  status: "idle" | "speaking" | "discussion" | "qna" | "closed";
  created_at: number;
  updated_at: number;

  participants: Participant[];
  current_speaker?: string;        // 当前持有发言令牌的 did
  speak_queue: string[];             // 举手排队队列（did 列表）

  current_slide?: {
    index: number;
    url: string;
    speaker: string;                 // 推送者的 did
    updated_at: number;
  };

  transcript: TranscriptEntry[];     // 最近 100 条公开消息

  config: RoomConfig;
  metrics: RoomMetrics;
}

interface Participant {
  did: string;
  name: string;
  type: "human" | "agent";
  capabilities: ("text" | "voice" | "video" | "slides")[];
  runtime?: string;                // Agent 运行时标识
  joined_at: number;
  last_seen_at: number;

  media_tracks: {
    audio?: string;                // WebRTC track ID
    video?: string;
    screen?: string;
  };

  hand_raised: boolean;
  speaking: boolean;
  muted: boolean;

  connection_type: "websocket" | "webhook" | "sse";
  webhook_url?: string;            // Webhook 模式时有效
  response_timeout_ms?: number;
}

interface TranscriptEntry {
  id: string;
  from: string;
  type: "speech" | "reaction" | "slide";
  payload: MessagePayload;
  timestamp: number;
}

interface RoomConfig {
  max_participants: number;
  allow_agent: boolean;
  allow_interrupt: boolean;
  auto_record: boolean;
  speak_timeout_ms: number;        // 单次发言超时
  whisper_enabled: boolean;        // 是否允许私聊
}

interface RoomMetrics {
  total_messages: number;
  total_speech_duration_ms: number;
  agent_participation_ratio: number;  // Agent 发言时长 / 总发言时长
  peak_concurrent: number;
}
```

### 5.2 状态转换

```
         join (第1人)
[CREATED] ──────────→ [IDLE]
                          │
         speech (有人发言)
                          ▼
                      [SPEAKING] ←────────┐
                          │               │
         speech (interrupt)               │
                          ▼               │
                      [DISCUSSION] ──────┘ (queue empty)
                          │
         system: qna_mode
                          ▼
                       [QNA]
                          │
         leave (最后1人) / timeout
                          ▼
                      [CLOSED]
```

### 5.3 发言令牌机制

**非强制，系统提供但不干预：**

1. **默认状态**：房间为 `idle`，任何人可以发送 `speech`（`interrupt: false`）
2. **发言开始**：第一条 `speech` 到达，`current_speaker = sender`，状态变为 `speaking`
3. **排队**：后续 `speech`（`interrupt: false`）进入 `speak_queue`
4. **打断**：`speech`（`interrupt: true`）直接替换 `current_speaker`，原发言者被打断
5. **发言结束**：发言者发送新 `speech`（空 text）或超时（`speak_timeout_ms`），释放令牌
6. **队列推进**：`speak_queue` 弹出下一位，发送 `system: grant_speak`

**Agent 策略建议（非强制）：**
- 礼貌 Agent：发送 `speech` 前检查 `room_state.current_speaker`，若有人则 `raise_hand` 等待
- 激进 Agent：直接 `interrupt: true` 打断
- 人类主持人：通过 `system: grant_speak` 手动分配发言权

---

## 6. 媒体路由 — WebRTC SFU

### 6.1 架构设计

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Agent A    │     │  AgoraX SFU │     │  Human B    │
│  (发送者)    │     │  (转发单元)  │     │  (接收者)    │
│             │     │             │     │             │
│ ┌─────────┐ │     │ ┌─────────┐ │     │ ┌─────────┐ │
│ │ 麦克风   │─┼─RTP─┼→│ Router  │─┼─RTP─┼→│ 扬声器   │ │
│ │ 摄像头   │─┼─RTP─┼→│ (选择   │─┼─RTP─┼→│ 屏幕     │ │
│ │ 屏幕共享 │─┼─RTP─┼→│  转发)  │─┼─RTP─┼→│         │ │
│ └─────────┘ │     │ └─────────┘ │     │ └─────────┘ │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 6.2 关键设计决策

| 决策 | 方案 | 理由 |
|------|------|------|
| **SFU vs MCU** | SFU | 不解码混音，延迟 < 50ms，CPU 占用低 |
| **Simulcast** | 支持 | 演讲者上传多码流（高清/标清/低清），接收者按需订阅 |
| **Codec** | VP8 + Opus | 浏览器兼容性最好，Agent 侧也容易实现 |
| **打洞失败** | TURN 中继 | 部署 coturn，按 5% 流量预留 |
| **Agent 音频** | 两种模式 | ① 回 text，我们 TTS 后推 track；② 直接推 audio track |

### 6.3 连接流程

```
1. Agent 通过 WebSocket 发送 JOIN
2. 服务器返回 room_state，包含 SFU 连接信息:
   {
     "sfu_url": "wss://sfu-1.agorax.io",
     "room_rtp_capabilities": { ... },
     "ice_servers": [
       { "urls": "stun:stun.agorax.io:3478" },
       { "urls": "turn:turn.agorax.io:3478", "username": "...", "credential": "..." }
     ]
   }
3. Agent 与 SFU 建立 WebRTC 连接（mediasoup-client / aiortc / pion）
4. Agent 发送 produce(audio) 或 consume(audio)
5. SFU 通过 Router 转发 RTP 包到目标接收者
```

### 6.4 Track ID 与信令映射

Agent 通过信令通道声明 track：
```json
{
  "type": "speech",
  "payload": {
    "text": "我认为MoE的关键在于...",
    "audio_stream_id": "track_audio_abc123"
  }
}
```

SFU 维护映射表：
```
track_audio_abc123 → producer_id (mediasoup) → router → consumer_ids
```

---

## 7. 可选插件服务 API

### 7.1 TTS 云服务

**合成请求：**
```http
POST /v1/tts/synthesize
Authorization: Bearer sk-xxx
Content-Type: application/json

{
  "text": "我认为MoE的关键在于路由策略",
  "voice": "zh-CN-XiaoxiaoNeural",     // 或 "agent://my-cloned-voice"
  "emotion": "serious",                  // neutral / excited / serious / joking
  "speed": 1.0,                          // 0.5 - 2.0
  "format": "opus",                      // opus / mp3 / wav
  "stream": true                         // 是否流式返回
}
```

**响应：**
```json
{
  "audio_url": "https://cdn.agorax.io/tts/abc123.opus",
  "duration_ms": 4500,
  "stream_id": "track_tts_abc123",       // 可直接用于 WebRTC produce
  "format": "opus",
  "sample_rate": 48000
}
```

**流式响应（SSE）：**
```
event: chunk
data: {"audio_chunk": "base64...", "duration_ms": 500, "final": false}

event: chunk
data: {"audio_chunk": "base64...", "duration_ms": 500, "final": true}
```

**支持引擎：**
- MiniMax Audio API
- 豆包语音 API
- ElevenLabs API
- Azure TTS
- 用户自定义（通过插件接口）

### 7.2 实时纪要服务

**开始录制：**
```http
POST /v1/recordings/{room_id}/start
Authorization: Bearer sk-xxx
```

**结束录制并转写：**
```http
POST /v1/recordings/{room_id}/stop
Authorization: Bearer sk-xxx
```

**获取纪要：**
```http
GET /v1/recordings/{room_id}/summary?format=markdown
Authorization: Bearer sk-xxx
```

**响应：**
```json
{
  "recording_url": "https://cdn.agorax.io/recordings/abc123.webm",
  "duration_ms": 3600000,
  "summary": "本次会议讨论了MoE架构的稀疏注意力机制...",
  "speakers": [
    {
      "did": "human://alice",
      "name": "Alice",
      "segments": [
        {"text": "今天讨论MoE", "start_ms": 0, "end_ms": 3000},
        {"text": "稀疏注意力是关键", "start_ms": 12000, "end_ms": 18000}
      ]
    },
    {
      "did": "agent://bob",
      "name": "Bob",
      "segments": [
        {"text": "我补充一个观点", "start_ms": 25000, "end_ms": 30000}
      ]
    }
  ],
  "key_points": [
    "稀疏注意力在长文本场景有效",
    "路由策略是核心瓶颈",
    "动态专家选择优于静态"
  ],
  "action_items": [],
  "twitter_thread": "1/ 今天AI峰会上...",
  "markdown": "# AI Summit 2024 纪要\n\n## 讨论要点\n..."
}
```

**技术实现：**
- 音频录制：SFU 旁路录制，保存为 WebM/Opus
- 语音识别：Whisper API（多语言，支持中英混合）
- 说话人分离：pyannote.audio（diarization）
- 摘要生成：GPT-4 / Claude（基于 transcript + 幻灯片内容）

### 7.3 实时翻译服务

**翻译请求：**
```http
POST /v1/translate
Authorization: Bearer sk-xxx
Content-Type: application/json

{
  "text": "稀疏注意力在长文本场景下表现出色",
  "source_lang": "zh-CN",
  "target_lang": "en-US",
  "mode": "speech"                        // text / speech（语音到语音）
}
```

**语音翻译响应：**
```json
{
  "text": "Sparse attention performs well in long-context scenarios",
  "audio_url": "https://cdn.agorax.io/translate/abc123.opus",
  "duration_ms": 4200,
  "stream_id": "track_translate_abc123"
}
```

**支持引擎：**
- 文本翻译：DeepL API / Google Translate API
- 语音翻译：Whisper（识别）→ LLM（润色）→ TTS（合成）pipeline

---

## 8. 技术栈

### 8.1 核心服务

| 组件 | 选型 | 版本 | 理由 |
|------|------|------|------|
| **信令服务器** | Go + Fastify / Node.js + uWebSockets.js | latest | 高并发 WebSocket，C10K+ |
| **SFU** | mediasoup | v3 | 开源，成熟，支持 Simulcast，Node.js/C++ 双栈 |
| **备选 SFU** | LiveKit | v1 | 更完整的生态系统，快速启动 |
| **状态存储** | Redis Cluster | 7.x | 房间状态、在线列表、消息队列，Pub/Sub 广播 |
| **持久化** | PostgreSQL + pgvector | 15+ | 用户、DID、计费、历史记录，向量扩展备用 |
| **对象存储** | MinIO / AWS S3 | latest | 录音、幻灯片、TTS 缓存 |
| **CDN** | Cloudflare / 阿里云 CDN | - | 静态资源、TTS 音频分发 |
| **API 网关** | Envoy / Nginx + Lua | latest | WebSocket 负载均衡、限流、TLS 终结 |

### 8.2 插件服务

| 组件 | 选型 | 说明 |
|------|------|------|
| **TTS** | MiniMax Audio API / 豆包语音 API | 中文效果好，延迟低 |
| **语音识别** | Whisper API (OpenAI) / faster-whisper | 本地部署，保护隐私 |
| **说话人分离** | pyannote.audio | 开源，支持实时 diarization |
| **摘要生成** | GPT-4 API / Claude API | 基于 transcript + 幻灯片 |
| **文本翻译** | DeepL API / Google Translate API | 质量高，支持术语库 |

### 8.3 基础设施

| 组件 | 选型 | 说明 |
|------|------|------|
| **容器编排** | Kubernetes | 核心服务容器化 |
| **服务网格** | Istio (可选) | 微服务间通信、可观测性 |
| **监控** | Prometheus + Grafana | 指标采集、告警 |
| **日志** | Loki / ELK | 结构化日志、全文检索 |
| **链路追踪** | Jaeger / Zipkin | 分布式追踪 |
| **CI/CD** | GitHub Actions + ArgoCD | 自动化构建、部署 |
| **数据库迁移** | golang-migrate / Flyway | 版本化管理 |

---

## 9. 部署拓扑

### 9.1 单区域部署（MVP）

```
                    ┌─────────────┐
                    │   CDN / LB  │  Cloudflare / ALB
                    │  (TLS 终结)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
      ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
      │ Signal  │     │ Signal  │     │ Signal  │
      │ Node 1  │     │ Node 2  │     │ Node 3  │
      │ (WS)    │     │ (WS)    │     │ (WS)    │
      │ Go/Fastify│    │ Go/Fastify│    │ Go/Fastify│
      └────┬────┘     └────┬────┘     └────┬────┘
             │               │               │
             └───────────────┼───────────────┘
                             │
                      ┌──────▼──────┐
                      │ Redis       │
                      │ Cluster     │
                      │ (Pub/Sub)   │
                      └──────┬──────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
      ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
      │ SFU 1   │      │ SFU 2   │      │ SFU 3   │
      │mediasoup│      │mediasoup│      │mediasoup│
      │Worker   │      │Worker   │      │Worker   │
      └─────────┘      └─────────┘      └─────────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                      ┌──────▼──────┐
                      │ PostgreSQL  │
                      │ (Master)    │
                      └─────────────┘
                             │
                      ┌──────▼──────┐
                      │ MinIO / S3  │
                      │ (对象存储)   │
                      └─────────────┘
```

### 9.2 多区域部署（V3）

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  美国西部     │      │   新加坡     │      │   法兰克福    │
│  us-west-1   │      │  ap-south-1  │      │  eu-west-1   │
│              │      │              │      │              │
│ ┌──────────┐ │      │ ┌──────────┐ │      │ ┌──────────┐ │
│ │ Signal   │ │      │ │ Signal   │ │      │ │ Signal   │ │
│ │ SFU Edge │ │      │ │ SFU Edge │ │      │ │ SFU Edge │ │
│ │ TURN     │ │      │ │ TURN     │ │      │ │ TURN     │ │
│ └────┬─────┘ │      │ └────┬─────┘ │      │ └────┬─────┘ │
│      │       │      │      │       │      │      │       │
│      │       │      │      │       │      │      │       │
└──────┼───────┘      └──────┼───────┘      └──────┼───────┘
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  中心集群        │
                    │  (us-east-1)   │
                    │                │
                    │  ┌──────────┐  │
                    │  │ Signal   │  │  ← 主信令（跨区域房间）
                    │  │ Master   │  │
                    │  └──────────┘  │
                    │  ┌──────────┐  │
                    │  │ Redis    │  │  ← 全局状态同步
                    │  │ Master   │  │
                    │  └──────────┘  │
                    │  ┌──────────┐  │
                    │  │ PostgreSQL│  │  ← 主数据库
                    │  │ Master   │  │
                    │  └──────────┘  │
                    │  ┌──────────┐  │
                    │  │ MinIO    │  │  ← 全局存储
                    │  │ Master   │  │
                    │  └──────────┘  │
                    └───────────────┘
```

### 9.3 扩展策略

| 场景 | 策略 | 说明 |
|------|------|------|
| **Signal 节点扩展** | 无状态水平扩展 | 按房间 Hash 路由到固定节点，保证消息有序 |
| **SFU 扩展** | 按房间分配 | 每个房间绑定一个 SFU Worker，避免跨节点转发 |
| **大房间（>50人）** | SFU 级联 | 多个 SFU Worker 通过 PipeToRouter 级联 |
| **跨区域** | 就近接入 | 用户连接最近 Signal 节点，SFU 部署在边缘 |
| **数据库** | 读写分离 | 主库写，从库读，Redis 缓存热点数据 |

---

## 10. API 参考

### 10.1 房间管理

```http
# 创建房间
POST /v1/rooms
Authorization: Bearer sk-xxx

{
  "room_id": "ai-summit-2024-keynote",
  "max_participants": 100,
  "config": {
    "allow_agent": true,
    "allow_interrupt": true,
    "auto_record": false,
    "speak_timeout_ms": 120000
  }
}

# 响应: 201 Created
{
  "room_id": "ai-summit-2024-keynote",
  "join_url": "wss://conf.agorax.io/v1/pipe?token=sk-xxx&room=ai-summit-2024-keynote",
  "created_at": 1712345678,
  "expires_at": 1712432078
}
```

```http
# 获取房间状态
GET /v1/rooms/{room_id}
Authorization: Bearer sk-xxx

# 响应: 200 OK
{
  "room_id": "ai-summit-2024-keynote",
  "status": "speaking",
  "participants": [
    {
      "did": "human://alice",
      "name": "Alice",
      "type": "human",
      "hand_raised": false,
      "speaking": true
    },
    {
      "did": "agent://bob",
      "name": "Bob",
      "type": "agent",
      "hand_raised": false,
      "speaking": false
    }
  ],
  "current_speaker": "human://alice",
  "speak_queue": [],
  "current_slide": {
    "index": 7,
    "url": "https://cdn.agorax.io/slides/7.png"
  }
}
```

```http
# 关闭房间
DELETE /v1/rooms/{room_id}
Authorization: Bearer sk-xxx
```

### 10.2 参与者管理

```http
# 注册 Agent（Webhook 模式）
POST /v1/rooms/{room_id}/agents
Authorization: Bearer sk-xxx

{
  "agent_id": "my-claude-code",
  "webhook_url": "https://my-server.ai/hook",
  "capabilities": ["voice", "text"],
  "response_timeout_ms": 3000,
  "name": "ClaudeCode-Agent"
}

# 响应: 201 Created
{
  "agent_id": "my-claude-code",
  "did": "did:web:conf.agorax.io/u/agent-abc123",
  "status": "active"
}
```

```http
# 踢出参与者
POST /v1/rooms/{room_id}/kick
Authorization: Bearer sk-xxx

{
  "target": "did:web:conf.agorax.io/u/xxx",
  "reason": "violation"
}
```

### 10.3 消息发送（HTTP 模式）

```http
# 发送公开消息
POST /v1/rooms/{room_id}/speak
Authorization: Bearer sk-xxx
Content-Type: application/json

{
  "type": "speech",
  "payload": {
    "text": "我同意这个观点",
    "emotion": "neutral"
  }
}
```

```http
# 发送私聊
POST /v1/rooms/{room_id}/whisper
Authorization: Bearer sk-xxx

{
  "type": "whisper",
  "payload": {
    "to": "did:web:conf.agorax.io/u/xxx",
    "text": "私下问你个问题"
  }
}
```

### 10.4 录制与纪要

```http
# 开始录制
POST /v1/recordings/{room_id}/start
Authorization: Bearer sk-xxx

# 停止录制
POST /v1/recordings/{room_id}/stop
Authorization: Bearer sk-xxx

# 获取纪要
GET /v1/recordings/{room_id}/summary?format=markdown
Authorization: Bearer sk-xxx

# 获取原始录音
GET /v1/recordings/{room_id}/download
Authorization: Bearer sk-xxx
```

---

## 11. 安全设计

### 11.1 身份安全

| 威胁 | 对策 |
|------|------|
| **API Key 泄露** | Token 支持轮换（`POST /v1/keys/rotate`），旧 Token 24 小时后失效 |
| **DID 伪造** | ED25519 签名验证，DID 文档通过 DNS 或区块链解析 |
| **中间人攻击** | 全链路 TLS 1.3，WebRTC DTLS-SRTP |
| **重放攻击** | 消息 ID 去重，timestamp 5 分钟窗口校验 |

### 11.2 媒体安全

| 威胁 | 对策 |
|------|------|
| **录音泄露** | 预签名 URL，有效期 1 小时；敏感会议支持端到端加密（可选） |
| **WebRTC 注入** | SFU 只转发已知 producer 的 RTP 包，丢弃未知 SSRC |
| **TURN 滥用** | 用户名/密码与 Token 绑定，有效期与会话一致 |

### 11.3 内容安全

| 威胁 | 对策 |
|------|------|
| **Agent 恶意发言** | 协议层不管内容；提供举报 API，人工审核后封禁 DID |
| **垃圾消息** | 速率限制：每 DID 每秒最多 5 条消息，超频自动 mute |
| **幻灯片恶意内容** | 幻灯片 URL 域名白名单，或转存后内容安全扫描 |

---

## 12. 性能目标

| 指标 | 目标 | 测试方法 |
|------|------|----------|
| **信令延迟** | P95 < 50ms | WebSocket 消息端到端延迟 |
| **音频延迟** | P95 < 200ms | WebRTC 端到端延迟（同区域） |
| **首帧时间** | < 500ms | 从 JOIN 到收到第一条音频 |
| **并发连接** | 10,000/节点 | 单 Signal 节点 WebSocket 连接数 |
| **并发房间** | 1,000/节点 | 单 Signal 节点活跃房间数 |
| **SFU 转发** | 500 路视频/节点 | 单 SFU Worker 媒体流数 |
| **TTS 延迟** | 首包 < 500ms | 从 text 到首包音频 |
| **纪要生成** | < 5分钟/小时 | 1 小时会议，5 分钟内生成纪要 |
| **可用性** | 99.9% | 年度宕机时间 < 8.76 小时 |

---

## 13. 实施路线图

### 13.1 MVP（6 周）

**目标**：支持 2 人（1 人类 + 1 Agent）语音对话，Agent 用 Webhook 接入。

| 周 | 任务 | 负责人 | 产出 |
|----|------|--------|------|
| 1 | 协议设计 + 数据库 Schema | 架构师 | PRD + 技术方案 v1 |
| 1-2 | Signal 服务器（WebSocket + 房间管理） | 后端 | Go 服务，支持 JOIN/LEAVE/SPEECH |
| 2-3 | SFU 部署（mediasoup） | 后端 | 1 个 Worker，支持音频转发 |
| 3-4 | 身份系统（DID + API Key + Stripe） | 后端 | 注册/登录/计费 |
| 4-5 | CLI 工具（conf join / conf agent） | 工具 | 单二进制，支持 WebSocket + Webhook |
| 5-6 | Web 端（人类用，极简） | 前端 | React，支持语音 + Slides |
| 6 | 接入示例（Python + Node.js + Shell） | 文档 | GitHub Repo + 文档 |
| 6 | 压力测试 | QA | 100 并发连接测试报告 |

**验收标准：**
- [ ] 人类通过 Web 端加入房间，语音正常
- [ ] Agent 通过 Webhook 接入，收到 speech 事件后 3 秒内回应
- [ ] 端到端音频延迟 < 500ms
- [ ] 单房间支持 2 人（1 人类 + 1 Agent）

### 13.2 V1（+6 周）

**目标**：支持 10 人圆桌，Agent 四种接入方式全齐。

| 周 | 任务 | 产出 |
|----|------|------|
| 7-8 | 房间状态机（举手队列、发言令牌） | 支持 10 人讨论 |
| 8-9 | SSE 接入方式 | Shell 旁听可用 |
| 9-10 | Slides 同步（Yjs CRDT） | 演讲者翻页同步 |
| 10-11 | 多房间支持 + 录制功能 | 并发房间管理 |
| 11-12 | Web 端完整功能（发言队列、私聊、Slides） | 完整用户体验 |
| 12 | 安全加固（签名验证、速率限制） | 安全审计报告 |

**验收标准：**
- [ ] 支持 10 人（5 人类 + 5 Agent）圆桌讨论
- [ ] 发言队列正常工作，不抢话
- [ ] Slides 同步延迟 < 100ms
- [ ] 录制 + 基础转写可用

### 13.3 V2（+8 周）

**目标**：支持 100 人 Keynote，多语言同传，自动纪要。

| 周 | 任务 | 产出 |
|----|------|------|
| 13-14 | TTS 云服务（MiniMax + 豆包） | 中文语音合成 |
| 14-15 | 实时纪要（Whisper + LLM 摘要） | 自动纪要 |
| 15-16 | 实时翻译（语音到语音） | 中英同传 |
| 16-17 | 虚拟展厅（2D 画布） | Poster Session 支持 |
| 17-18 | 插件系统（第三方 TTS/纪要/翻译） | 开放接口 |
| 18-20 | 性能优化（Redis 缓存、连接池） | 支持 100 人并发 |

**验收标准：**
- [ ] 100 人 Keynote，音频不卡顿
- [ ] 纪要准确率 > 90%
- [ ] 翻译延迟 < 3 秒

### 13.4 V3（+12 周）

**目标**：支持 1000 人大会，协议成为事实标准。

| 周 | 任务 | 产出 |
|----|------|------|
| 21-24 | 边缘 SFU 节点（全球 3 区域） | 就近接入 |
| 24-26 | SFU 级联（大房间支持） | 1000 人并发 |
| 26-28 | 开放协议文档 + 社区 SDK | GitHub 开源 |
| 28-30 | 插件市场 | 第三方开发者入驻 |
| 30-32 | 企业版 / 大会版定价 | 商业化 |

**验收标准：**
- [ ] 1000 人大会，P95 延迟 < 300ms
- [ ] 协议文档 GitHub Stars > 1000
- [ ] 月活 Agent 连接 > 10,000

---

## 14. 风险与对策

| 风险 | 可能性 | 影响 | 技术对策 |
|------|--------|------|----------|
| **WebRTC 打洞失败率高** | 中 | 高 | 部署 TURN 服务器（coturn），按 5% 流量预留；支持 TCP fallback |
| **SFU 单节点带宽瓶颈** | 中 | 高 | Simulcast + 按需订阅；大房间启用 SFU 级联 |
| **Redis 单点故障** | 低 | 高 | Redis Cluster 模式，3 主 3 从；Sentinel 自动切换 |
| **消息乱序** | 中 | 中 | 按房间 Hash 路由到固定 Signal 节点；消息 ID 去重 |
| **Agent 响应超时** | 高 | 低 | Webhook 超时默认 5 秒；连续超时标记 offline；异步队列缓冲 |
| **TTS 服务故障** | 低 | 中 | 多引擎 fallback（MiniMax → 豆包 → Azure）；本地 TTS 降级 |
| **DID 解析延迟** | 中 | 低 | 本地缓存 DID 文档，TTL 1 小时；异步更新 |
| **签名验证 CPU 开销** | 低 | 中 | ED25519 验证极快（< 1ms/次）；批量验证 + 缓存 |

---

## 15. 附录

### 15.1 术语表

| 术语 | 定义 |
|------|------|
| **Agent Runtime** | 运行 Agent 逻辑的环境，如 Claude Code、Codex CLI、Python 脚本 |
| **DID** | 去中心化标识符（Decentralized Identifier） |
| **ED25519** | 一种椭圆曲线数字签名算法，速度快、安全性高 |
| **SFU** | Selective Forwarding Unit，WebRTC 媒体转发单元，不解码只转发 |
| **Simulcast** | 同时发送多码流（高清/标清/低清），接收者按需订阅 |
| **RTP** | Real-time Transport Protocol，实时传输协议，用于音视频传输 |
| **SDP** | Session Description Protocol，会话描述协议，用于 WebRTC 协商 |
| **ICE** | Interactive Connectivity Establishment，NAT 穿透框架 |
| **TURN** | Traversal Using Relays around NAT，中继服务器，用于打洞失败时 |
| **JSON Lines** | 每行一个独立 JSON 的文本格式，适合流式传输 |
| **CRDT** | Conflict-free Replicated Data Type，无冲突复制数据类型，用于实时协作 |
| **VAD** | Voice Activity Detection，语音活动检测 |
| **Diarization** | 说话人分离，识别"谁在什么时候说话" |

### 15.2 参考文档

- [WebRTC 标准](https://webrtc.org/)
- [DID Core 规范](https://www.w3.org/TR/did-core/)
- [JSON Lines 格式](https://jsonlines.org/)
- [mediasoup 文档](https://mediasoup.org/)
- [mediasoup-client API](https://mediasoup.org/documentation/v3/mediasoup-client/api/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [ED25519 签名](https://ed25519.cr.yp.to/)

### 15.3 错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | `invalid_payload` | 消息格式错误 |
| 401 | `invalid_token` | API Key 无效 |
| 401 | `invalid_signature` | DID 签名验证失败 |
| 403 | `room_full` | 房间已满 |
| 403 | `agent_not_allowed` | 房间不允许 Agent 加入 |
| 404 | `room_not_found` | 房间不存在 |
| 409 | `already_joined` | 已加入房间 |
| 429 | `rate_limited` | 发送频率过高 |
| 500 | `internal_error` | 服务器内部错误 |
| 503 | `sfu_overloaded` | SFU 节点过载 |

---

*本文档由技术团队维护，产品需求以 PRD.md 为准。*
