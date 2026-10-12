import React, { useEffect, useState, useRef } from 'react'
import client from '../api/client'
import ConnectApiState from '../components/ConnectApiState'
import { MessageCircle, Send, Trash2, Tractor } from 'lucide-react'

export default function AiAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(true)
  const [reason, setReason] = useState('')
  const [fields, setFields] = useState([])
  const [fieldId, setFieldId] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    client.get('/chat/history').then((res) => setMessages(res.data))
    client.get('/fields').then((res) => {
      setFields(res.data)
      if (res.data.length > 0) setFieldId(String(res.data[0].id))
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    const userText = input
    setInput('')
    setMessages((m) => [...m, { id: 'temp-' + Date.now(), role: 'user', content: userText, created_at: new Date().toISOString() }])
    setSending(true)
    try {
      const res = await client.post('/chat', { message: userText, field_id: fieldId ? Number(fieldId) : null })
      setConnected(res.data.connected)
      setReason(res.data.reason)
      if (res.data.connected) {
        setMessages((m) => [...m, { id: 'reply-' + Date.now(), role: 'assistant', content: res.data.reply, created_at: new Date().toISOString() }])
      }
    } finally {
      setSending(false)
    }
  }

  const clearChat = async () => {
    await client.delete('/chat/history')
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-earth-800 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-farm-600" /> AI Farm Assistant
          </h1>
          <p className="text-sm text-earth-800/50">Ask about your crops, weather, or treatment plans</p>
        </div>
        <div className="flex items-center gap-2">
          {fields.length > 0 && (
            <select className="input text-sm py-2" value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
              <option value="">No field context</option>
              {fields.map((f) => <option key={f.id} value={f.id}>{f.name} · {f.crop}</option>)}
            </select>
          )}
          <button onClick={clearChat} className="btn-secondary text-sm"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto card space-y-4">
        {messages.length === 0 && (
          <div className="empty-state">
            <Tractor className="w-8 h-8 mb-2 text-farm-300" />
            <p className="text-sm">Ask something like "Should I spray pesticide today?"</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === 'user' ? 'bg-farm-600 text-white' : 'bg-farm-50 text-earth-800'
            }`}>
              <p className="whitespace-pre-line">{m.content}</p>
              <p className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-farm-100' : 'text-earth-800/40'}`}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {sending && <p className="text-xs text-earth-800/40">AI Farm Assistant is typing…</p>}
        <div ref={bottomRef} />
      </div>

      {!connected && (
        <div className="mt-3">
          <ConnectApiState title="AI Farm Assistant needs Groq connected" reason={reason} envVar="GROQ_API_KEY" />
        </div>
      )}

      <form onSubmit={send} className="flex gap-2 mt-4">
        <input className="input flex-1" placeholder="Ask a question…" value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" disabled={sending} className="btn-primary"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  )
}
