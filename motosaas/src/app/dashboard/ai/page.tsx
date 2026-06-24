'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Brain,
  ScanText,
  Smile,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Wrench,
  DollarSign,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  Send,
  CheckCircle,
  Info,
} from 'lucide-react'

const mockInsights = {
  documentOCR: {
    scans: [
      { id: 1, doc: 'Contract #1042', extracted: 'Customer: Ahmed Benali, Vehicle: Yamaha MT-07', confidence: 97 },
      { id: 2, doc: 'ID Card #881', extracted: 'Name: Fatima Zahra, Exp: 2028-05-12', confidence: 94 },
      { id: 3, doc: 'Insurance #305', extracted: 'Provider: AXA, Coverage: Full', confidence: 91 },
    ],
  },
  sentiment: { positive: 68, neutral: 22, negative: 10 },
  reminders: [
    { time: '09:00 AM', rate: 72, label: 'Morning' },
    { time: '02:00 PM', rate: 65, label: 'Afternoon' },
    { time: '07:00 PM', rate: 81, label: 'Evening' },
  ],
  churn: [
    { name: 'Youssef El Idrissi', risk: 85, action: 'Send 15% discount offer' },
    { name: 'Sara Alaoui', risk: 72, action: 'Personal follow-up call' },
    { name: 'Omar Tazi', risk: 68, action: 'Free upgrade to next category' },
  ],
  paymentDefault: [
    { name: 'Khalid Mansouri', risk: 'High', amount: '12,500 MAD', deposit: '50%' },
    { name: 'Nadia Berrada', risk: 'Medium', amount: '8,200 MAD', deposit: '30%' },
    { name: 'Rachid Filali', risk: 'Low', amount: '3,100 MAD', deposit: '20%' },
  ],
  anomalies: [
    { type: 'Rental Pattern', desc: 'Vehicle YMT-07 rented 8x more than average this week', severity: 'warning' },
    { type: 'Pricing', desc: 'Weekend rates 40% below competitor average', severity: 'critical' },
    { type: 'Usage', desc: 'Customer ID #204 returned vehicle 3x this week', severity: 'info' },
  ],
  vehicleRecs: [
    { based: 'Yamaha MT-07', recommend: 'Honda CB500F', match: 92 },
    { based: 'Kawasaki Z650', recommend: 'Yamaha XSR700', match: 88 },
    { based: 'BMW R1250GS', recommend: 'Triumph Tiger 900', match: 85 },
  ],
  maintenance: [
    { vehicle: 'Yamaha MT-07 #YMT-07', issue: 'Brake pads at 15%', date: '2026-07-01' },
    { vehicle: 'Honda CB500F #HCB-02', issue: 'Oil change overdue', date: '2026-06-28' },
    { vehicle: 'Kawasaki Z650 #KZ-11', issue: 'Chain tension low', date: '2026-07-05' },
  ],
  pricing: [
    { vehicle: 'BMW R1250GS', current: 800, suggested: 950, impact: '+18%' },
    { vehicle: 'Yamaha MT-07', current: 400, suggested: 360, impact: '+12% bookings' },
    { vehicle: 'Honda CB500F', current: 350, suggested: 390, impact: '+9%' },
  ],
  revenue: {
    total: '284,500 MAD',
    projected: '331,400 MAD',
    increase: '+16.5%',
    suggestions: ['Increase weekend rates by 15%', 'Bundle insurance with premium bikes', 'Launch loyalty program for repeat renters'],
  },
}

const chatMessages = [
  { role: 'assistant', text: 'Hello! I\'m your MotoRent AI assistant. How can I help you manage your fleet today?' },
]

export default function AIInsightsPage() {
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState(chatMessages)

  const handleSend = () => {
    if (!chatInput.trim()) return
    const userMsg = { role: 'user', text: chatInput }
    const responses: Record<string, string> = {
      default: 'Based on your current fleet data, I recommend focusing on increasing weekend utilization rates. Your Saturday bookings are 35% lower than weekday averages.',
      revenue: 'Your current monthly revenue is 284,500 MAD. With smart pricing adjustments, you could reach 331,400 MAD — a potential 16.5% increase.',
      maintenance: 'I detect 3 vehicles needing attention soon. The Honda CB500F #HCB-02 oil change is overdue and should be scheduled immediately.',
      pricing: 'Smart pricing analysis suggests raising BMW R1250GS weekend rates from 800 to 950 MAD for an estimated 18% revenue boost.',
      churn: 'Three customers are at high churn risk. Youssef El Idrissi has the highest risk at 85%. A 15% discount offer is recommended.',
    }
    const key = Object.keys(responses).find(k => chatInput.toLowerCase().includes(k)) || 'default'
    const aiMsg = { role: 'assistant', text: responses[key] }
    setMessages(prev => [...prev, userMsg, aiMsg])
    setChatInput('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#1a1b2e] to-[#2d2e45] text-white border-0">
        <CardContent className="flex items-center justify-between py-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <Brain className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Insights</h1>
              <p className="text-gray-300 text-sm mt-0.5">Powered by machine learning</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            <Zap className="w-3 h-3" />
            11 modules active
          </Badge>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-emerald-500">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Insights</p>
              <p className="text-2xl font-bold mt-1">24</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <Brain className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Alerts</p>
              <p className="text-2xl font-bold mt-1">5</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-500">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recommendations Applied</p>
              <p className="text-2xl font-bold mt-1">12</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1. Document OCR */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-violet-50">
                <ScanText className="w-4 h-4 text-violet-600" />
              </div>
              <CardTitle>Document OCR</CardTitle>
            </div>
            <CardAction>
              <Badge variant="secondary">3 scanned</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInsights.documentOCR.scans.map(scan => (
                <div key={scan.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{scan.doc}</span>
                    <Badge variant={scan.confidence >= 95 ? 'default' : 'outline'}>
                      {scan.confidence}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{scan.extracted}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 w-full justify-start">
              View all scans <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* 2. Customer Sentiment */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-pink-50">
                <Smile className="w-4 h-4 text-pink-600" />
              </div>
              <CardTitle>Customer Sentiment</CardTitle>
            </div>
            <CardAction>
              <Badge variant="secondary">156 reviews</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm w-16">Positive</span>
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${mockInsights.sentiment.positive}%` }} />
                </div>
                <span className="text-sm font-medium w-10 text-right">{mockInsights.sentiment.positive}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm w-16">Neutral</span>
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${mockInsights.sentiment.neutral}%` }} />
                </div>
                <span className="text-sm font-medium w-10 text-right">{mockInsights.sentiment.neutral}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm w-16">Negative</span>
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${mockInsights.sentiment.negative}%` }} />
                </div>
                <span className="text-sm font-medium w-10 text-right">{mockInsights.sentiment.negative}%</span>
              </div>
            </div>
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 w-full justify-start">
              Analyze reviews <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* 3. Smart Reminders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-50">
                <Clock className="w-4 h-4 text-cyan-600" />
              </div>
              <CardTitle>Smart Reminders</CardTitle>
            </div>
            <CardAction>
              <Badge variant="secondary">3 insights</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInsights.reminders.map(r => (
                <div key={r.time} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">{r.rate}%</p>
                    <p className="text-xs text-muted-foreground">response rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 w-full justify-start">
              Configure reminders <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* 4. Churn Prediction */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <CardTitle>Churn Prediction</CardTitle>
            </div>
            <CardAction>
              <Badge variant="destructive">3 at risk</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInsights.churn.map(c => (
                <div key={c.name} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{c.name}</span>
                    <Badge variant={c.risk >= 80 ? 'destructive' : 'outline'}>{c.risk}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 w-full justify-start">
              View risk report <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* 5. Payment Default Risk */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-50">
                <ShieldAlert className="w-4 h-4 text-orange-600" />
              </div>
              <CardTitle>Payment Default Risk</CardTitle>
            </div>
            <CardAction>
              <Badge variant="secondary">3 flagged</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInsights.paymentDefault.map(p => (
                <div key={p.name} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{p.name}</span>
                    <Badge
                      variant={p.risk === 'High' ? 'destructive' : p.risk === 'Medium' ? 'outline' : 'secondary'}
                    >
                      {p.risk}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Amount: {p.amount}</span>
                    <span>Suggested deposit: {p.deposit}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 w-full justify-start">
              Review payment risks <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* 6. Anomaly Detection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <CardTitle>Anomaly Detection</CardTitle>
            </div>
            <CardAction>
              <Badge variant="destructive">2 alerts</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInsights.anomalies.map((a, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{a.type}</span>
                    <Badge
                      variant={a.severity === 'critical' ? 'destructive' : a.severity === 'warning' ? 'outline' : 'secondary'}
                    >
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 w-full justify-start">
              View all anomalies <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* 7. Vehicle Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
              <CardTitle>Vehicle Recommendations</CardTitle>
            </div>
            <CardAction>
              <Badge variant="secondary">3 pairs</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInsights.vehicleRecs.map((r, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{r.based}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-medium text-emerald-600">{r.recommend}</span>
                  </div>
                  <div className="mt-1">
                    <Badge variant="outline">{r.match}% match</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 w-full justify-start">
              Explore recommendations <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* 8. Predictive Maintenance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-50">
                <Wrench className="w-4 h-4 text-teal-600" />
              </div>
              <CardTitle>Predictive Maintenance</CardTitle>
            </div>
            <CardAction>
              <Badge variant="outline">3 upcoming</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInsights.maintenance.map((m, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{m.vehicle}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{m.issue}</span>
                    <Badge variant="outline">{m.date}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 w-full justify-start">
              Schedule services <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* 9. Smart Pricing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-50">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <CardTitle>Smart Pricing</CardTitle>
            </div>
            <CardAction>
              <Badge variant="secondary">3 suggestions</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInsights.pricing.map((p, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">{p.vehicle}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Current: {p.current} MAD</span>
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                      <span className="font-medium text-emerald-600">Suggested: {p.suggested} MAD</span>
                    </div>
                    <Badge variant="default">{p.impact}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 w-full justify-start">
              Apply pricing <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* 10. Revenue Optimization */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle>Revenue Optimization</CardTitle>
            </div>
            <CardAction>
              <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                {mockInsights.revenue.increase} potential
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Current Revenue</p>
                  <p className="text-lg font-bold">{mockInsights.revenue.total}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Projected</p>
                  <p className="text-lg font-bold text-emerald-600">{mockInsights.revenue.projected}</p>
                </div>
              </div>
              <div className="space-y-2">
                {mockInsights.revenue.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 w-full justify-start">
              View revenue report <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* 11. Chat Assistant */}
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-50">
                <MessageSquare className="w-4 h-4 text-sky-600" />
              </div>
              <CardTitle>Chat Assistant</CardTitle>
            </div>
            <CardAction>
              <Badge variant="secondary">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Online
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-500 text-white rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your fleet..."
                className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <Button size="icon" onClick={handleSend} className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer note */}
      <Card className="bg-muted/30">
        <CardContent className="flex items-center gap-3 py-0">
          <Info className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            All insights are generated from simulated data. Connect your data sources to enable real-time AI analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
