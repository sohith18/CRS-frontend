export class RoomAPI {
  constructor(baseUrl) {
    this.base = baseUrl.replace(/\/$/, '')
  }

  async _post(path, body = {}) {
    const res = await fetch(`${this.base}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `HTTP ${res.status}`)
    }
    return res.json()
  }

  async _get(path) {
    const res = await fetch(`${this.base}${path}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  health()             { return this._get('/health') }
  start(body = {})     { return this._post('/start', body) }
  submitAnswer(answer) { return this._post('/answer', { answer }) }
  getQuestion()        { return this._get('/question') }
  reset()              { return this._post('/reset') }
}