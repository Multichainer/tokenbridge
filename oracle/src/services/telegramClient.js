const fetch = require('node-fetch')

function redact(text, secret) {
  if (!secret) return String(text)
  return String(text)
    .split(secret)
    .join('[redacted]')
}

function keyboard(requestId) {
  return {
    inline_keyboard: [
      [{ text: 'Approve', callback_data: `a:${requestId}` }, { text: 'Reject', callback_data: `r:${requestId}` }]
    ]
  }
}

function telegramClient(botToken) {
  async function call(method, body, timeout) {
    const url = `https://api.telegram.org/bot${botToken}/${method}`
    let response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        timeout: timeout || 15000
      })
    } catch (e) {
      throw new Error(redact(e.message, botToken))
    }

    let payload
    try {
      payload = await response.json()
    } catch (e) {
      throw new Error(`Telegram ${method} returned an unreadable response`)
    }
    if (!payload.ok) {
      throw new Error(payload.description || `Telegram ${method} failed`)
    }
    return payload.result
  }

  return {
    sendApproval(chatId, text, requestId) {
      return call('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: keyboard(requestId)
      })
    },
    editDecision(chatId, messageId, text) {
      return call('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [] }
      })
    },
    answerCallback(callbackQueryId, text) {
      return call('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text
      })
    },
    getUpdates(offset) {
      const body = {
        timeout: 25,
        allowed_updates: ['callback_query']
      }
      if (offset) body.offset = offset
      return call('getUpdates', body, 40000)
    }
  }
}

module.exports = telegramClient
module.exports.redact = redact
