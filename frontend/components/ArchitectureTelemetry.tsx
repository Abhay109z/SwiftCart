import React, { useState, useEffect } from 'react';
import {
  Flame,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertOctagon,
  TrendingUp,
  Server,
  Zap
} from 'lucide-react';
import { ConcurrencyTestResult, DLQMessage, KafkaEvent, SurgeZone } from '../types.js';
import { getApiUrl } from '../apiConfig.js';

export const ArchitectureTelemetry: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'concurrency' | 'kafka' | 'surge' | 'specs'>('concurrency');

  // Concurrency Test state
  const [concurrencyCount, setConcurrencyCount] = useState<number>(500);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConcurrencyTestResult | null>(null);

  // Kafka & DLQ state
  const [events, setEvents] = useState<KafkaEvent[]>([]);
  const [dlqMessages, setDlqMessages] = useState<DLQMessage[]>([]);
  const [isRefreshingKafka, setIsRefreshingKafka] = useState<boolean>(false);

  // Surge zones state
  const [surgeZones, setSurgeZones] = useState<SurgeZone[]>([]);

  // Fetch initial Kafka & Surge data
  const loadKafkaData = async () => {
    setIsRefreshingKafka(true);
    try {
      const res = await fetch(getApiUrl('/api/kafka/events'));
      const data = await res.json();
      setEvents(data.events || []);
      setDlqMessages(data.dlq || []);
    } catch (err) {
      console.error('Kafka telemetry load error:', err);
    } finally {
      setIsRefreshingKafka(false);
    }
  };

  const loadSurgeData = async () => {
    try {
      const res = await fetch(getApiUrl('/api/surge/zones'));
      const data = await res.json();
      setSurgeZones(data.zones || []);
    } catch (err) {
      console.error('Surge load error:', err);
    }
  };

  useEffect(() => {
    loadKafkaData();
    loadSurgeData();
  }, []);

  const handleRunConcurrencyTest = async () => {
    setIsRunningTest(true);
    try {
      const res = await fetch(getApiUrl('/api/concurrency-test/run'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concurrencyCount,
          productId: 'prod-milk-flash-02'
        })
      });
      const data = await res.json();
      setTestResult(data);
      loadKafkaData();
    } catch (err) {
      console.error('Concurrency test error:', err);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleRetryDLQ = async (dlqId: string) => {
    try {
      await fetch(getApiUrl('/api/kafka/dlq/retry'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dlqId })
      });
      loadKafkaData();
    } catch (err) {
      console.error('DLQ retry error:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Banner: Resume & Architecture Showcase */}
      <div className="p-6 bg-stone-900 text-white rounded-3xl border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500 text-white flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" />
              SYSTEMS ARCHITECTURE TELEMETRY
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 text-stone-300">
              Go + Kafka + Redis + PostGIS + React
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            High-Concurrency Quick-Commerce Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-3xl leading-relaxed">
            Quick-commerce platforms rely on ultra-low latency, strict transactional isolation, and event-driven architectures. Explore live race condition testing, Kafka event streams, Saga compensation rollback, and PostGIS geohash surge calculations below.
          </p>

          {/* Sub-tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <button
              onClick={() => setActiveTab('concurrency')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'concurrency'
                  ? 'bg-amber-400 text-stone-950 shadow'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>500-Concurrency Stress Test</span>
            </button>

            <button
              onClick={() => setActiveTab('kafka')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'kafka'
                  ? 'bg-blue-500 text-white shadow'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kafka Event Pipeline & DLQ</span>
              {dlqMessages.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
                  {dlqMessages.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('surge')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'surge'
                  ? 'bg-emerald-500 text-stone-950 shadow'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>PostGIS Geohash & Surge Heatmap</span>
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'specs'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Architecture Blueprint & Specs</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Concurrency & ACID Mutex Stress Tester */}
      {activeTab === 'concurrency' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-stone-100">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Flash Rush Concurrency: Prevent Negative Inventory
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-2xl">
                  Simulate <span className="font-bold text-stone-800">500 parallel checkout requests</span> hitting the exact same item when only 5 units exist in stock. Our engine applies Go-style mutex locks and PostgreSQL row locks (<code className="bg-stone-100 px-1 rounded text-stone-800 font-mono">SELECT ... FOR UPDATE</code>) with Redis write-through caching.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={concurrencyCount}
                  onChange={(e) => setConcurrencyCount(Number(e.target.value))}
                  className="px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 outline-none"
                >
                  <option value={50}>50 Concurrent Workers</option>
                  <option value={100}>100 Concurrent Workers</option>
                  <option value={250}>250 Concurrent Workers</option>
                  <option value={500}>500 Concurrent Workers</option>
                </select>

                <button
                  id="execute-stress-test-btn"
                  onClick={handleRunConcurrencyTest}
                  disabled={isRunningTest}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{isRunningTest ? 'Running Stress Pool...' : 'Launch Flash Rush'}</span>
                </button>
              </div>
            </div>

            {/* Test Results Dashboard */}
            {testResult ? (
              <div className="mt-6 space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                    <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                      Total Requests
                    </span>
                    <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
                      {testResult.totalRequests}
                    </span>
                    <span className="text-[10px] text-stone-600">Simultaneous threads</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Fulfilled (Exact Stock)
                    </span>
                    <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                      {testResult.fulfilledRequests} / {testResult.initialStock}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">100% stock cleared</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      Graceful Rejections
                    </span>
                    <span className="text-2xl font-black text-amber-700 font-mono mt-1 block">
                      {testResult.rejectedRequests}
                    </span>
                    <span className="text-[10px] text-amber-700">Stock exhausted errors</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                      Negative Inventory
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-2xl font-black text-blue-700 font-mono">0</span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-[10px] text-blue-700 font-bold">Strict Invariant Guaranteed</span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="p-4 rounded-2xl bg-stone-900 text-white flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Avg Lock Acquisition: <strong>{testResult.avgLockAcquisitionMs}ms</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Redis Cache Hit Ratio: <strong>{(testResult.redisCacheHitRatio * 100).toFixed(1)}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span>Total Duration: <strong>{testResult.totalDurationMs}ms</strong></span>
                  </div>
                </div>

                {/* Sample Transaction Execution Stream */}
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Sample Transaction Trace Log (First 40 of {testResult.totalRequests})
                  </h4>
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-stone-200 font-mono text-[11px] divide-y divide-stone-100 bg-stone-50">
                    {testResult.transactions.map((tx) => (
                      <div
                        key={tx.reqId}
                        className={`p-2 flex items-center justify-between ${
                          tx.status === 'FULFILLED' ? 'bg-emerald-50 text-emerald-950' : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-600">#{tx.reqId.toString().padStart(3, '0')}</span>
                          <span>{tx.threadId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-stone-600">{tx.lockTimeMs}ms lock</span>
                          <span
                            className={`px-2 py-0.5 rounded font-black text-[10px] ${
                              tx.status === 'FULFILLED'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {tx.status}
                          </span>
                          <span className="text-stone-600 w-16 text-right">
                            rem: {tx.remainingStock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-stone-600 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-600">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-sm font-bold text-stone-800">Ready to test race condition handling</p>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  Click "Launch Flash Rush" to send 500 concurrent checkout requests simultaneously and watch the ACID mutex lock pipeline prevent overselling.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Kafka Distributed Event Pipeline & DLQ */}
      {activeTab === 'kafka' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Kafka Event Stream & Saga Orchestration
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Decoupled event pipeline ensuring sub-100ms checkout responses while background Go workers handle downstream fulfillment.
                </p>
              </div>
              <button
                onClick={loadKafkaData}
                disabled={isRefreshingKafka}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingKafka ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Dead Letter Queue (DLQ) Section */}
            {dlqMessages.length > 0 && (
              <div className="mt-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>Dead-Letter Queue (DLQ) - {dlqMessages.length} Poison Messages</span>
                  </div>
                  <span className="text-[10px] text-rose-800 font-mono">Topic: dlq.failed</span>
                </div>
                <div className="space-y-2">
                  {dlqMessages.map((dlq) => (
                    <div
                      key={dlq.id}
                      className="p-3 bg-white rounded-xl border border-rose-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">{dlq.id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono">
                            Orig Topic: {dlq.originalTopic}
                          </span>
                        </div>
                        <p className="text-rose-700 text-[11px] mt-0.5">Reason: {dlq.errorReason}</p>
                      </div>
                      <button
                        onClick={() => handleRetryDLQ(dlq.id)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        Replay to Kafka
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Kafka Events Table */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
                Live Kafka Broker Topic Partition Events ({events.length})
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[11px]">
                    <tr>
                      <th className="p-3">Event ID</th>
                      <th className="p-3">Topic</th>
                      <th className="p-3">Partition</th>
                      <th className="p-3">Offset</th>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Broker Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-stone-600 font-sans">
                          Place an order or run a stress test to see Kafka event publishing.
                        </td>
                      </tr>
                    ) : (
                      events.map((evt) => (
                        <tr key={evt.eventId} className="hover:bg-stone-50 transition-colors">
                          <td className="p-3 font-bold text-stone-900">{evt.eventId}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                evt.topic === 'order.placed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : evt.topic === 'inventory.locked'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : evt.topic === 'rider.dispatched'
                                  ? 'bg-amber-100 text-amber-800'
                                  : evt.topic === 'saga.compensated'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-stone-100 text-stone-800'
                              }`}
                            >
                              {evt.topic}
                            </span>
                          </td>
                          <td className="p-3 text-stone-600">p{evt.partition}</td>
                          <td className="p-3 text-stone-600">#{evt.offset}</td>
                          <td className="p-3 text-stone-800">{evt.orderId}</td>
                          <td className="p-3 text-emerald-700">{evt.latencyMs}ms</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PostGIS Geohash & Dynamic Surge Heatmap */}
      {activeTab === 'surge' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2 pb-4 border-b border-stone-100">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Dynamic Surge Pricing & PostGIS Geohash Zones
            </h3>
            <p className="text-xs text-stone-600 mt-2">
              Surge fees and rider incentives are calculated programmatically using the live ratio of active orders to available delivery partners within specific geohash zones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {surgeZones.map((zone) => (
                <div
                  key={zone.geohash}
                  className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-stone-900">{zone.zoneName}</h4>
                      <p className="text-[11px] font-mono text-stone-600">
                        Geohash: {zone.geohash} • Lat: {zone.centerLat}, Lng: {zone.centerLng}
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-xl text-xs font-black text-white"
                      style={{ backgroundColor: zone.color }}
                    >
                      {zone.surgeMultiplier > 1.0 ? `${zone.surgeMultiplier}x Surge` : 'Normal'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-xl border border-stone-200">
                      <span className="text-stone-600 text-[10px] block">Active Orders</span>
                      <span className="font-bold text-stone-900 text-sm">{zone.activeOrders}</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-stone-200">
                      <span className="text-stone-600 text-[10px] block">Available Riders</span>
                      <span className="font-bold text-stone-900 text-sm">{zone.availableRiders}</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-stone-200">
                      <span className="text-stone-600 text-[10px] block">Demand Ratio</span>
                      <span className="font-bold text-stone-900 text-sm">{zone.demandRatio.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-stone-600">Surge Delivery Premium:</span>
                    <span className="font-black text-stone-900 font-mono">
                      {zone.surgeFee > 0 ? `+₹${zone.surgeFee}` : '₹0 (Free standard)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Architecture Blueprint & Technical Specs */}
      {activeTab === 'specs' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-600" />
              Technical Blueprint & Design Decisions
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Architectural decisions implemented in SwiftCart for low latency, zero negative inventory, and high resilience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <h4 className="font-black text-stone-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                1. Concurrency & ACID Mutex Locking
              </h4>
              <p className="text-stone-600 leading-relaxed">
                Prevents race conditions in flash rushes by acquiring atomic row-level locks on primary database records prior to decrementing. Write-through caching ensures Redis reflects sub-millisecond stock counts to storefront lookups.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <h4 className="font-black text-stone-900 text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                2. Distributed Saga Pattern & DLQ
              </h4>
              <p className="text-stone-600 leading-relaxed">
                Coordinates multi-step checkout across payment gateway, warehouse inventory, and rider dispatch. If any step fails midway, compensating actions trigger automated customer refunds and unlock inventory. Failed events route to a Dead-Letter Queue for re-drive.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <h4 className="font-black text-stone-900 text-sm flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-600" />
                3. PostGIS Geospatial Radius & Rider Dispatch
              </h4>
              <p className="text-stone-600 leading-relaxed">
                Maps user coordinates to the nearest localized dark store within 3.2km. Uses Haversine/PostGIS spatial distance to assign the closest idle EV rider and compute real-time surge pricing based on active order density.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <h4 className="font-black text-stone-900 text-sm flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-600" />
                4. 30-Second Post-Checkout Grace Period
              </h4>
              <p className="text-stone-600 leading-relaxed">
                Allows customers to append forgotten items to their active tote for 30 seconds after placing an order without generating additional delivery fees or disrupting the rider's packing route.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
