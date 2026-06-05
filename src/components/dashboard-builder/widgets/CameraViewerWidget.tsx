import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetConfig } from '../../../store/useBuilderStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Square, Radio, Loader2, AlertCircle, Volume2, VolumeX, Camera, Maximize, Minimize, Info, Aperture } from 'lucide-react';

interface CameraViewerWidgetProps {
  config: WidgetConfig;
  nodeId?: string;
  isEditMode?: boolean;
}

const STORAGE_KEYS = {
  relayOnly: 'pi-cam.relayOnly',
};

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CameraViewerWidget({ config, nodeId, isEditMode }: CameraViewerWidgetProps) {
  const [status, setStatus] = useState<'ready' | 'connecting' | 'streaming' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timelineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timeline state
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [draggingSlider, setDraggingSlider] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [connectionType, setConnectionType] = useState<'P2P' | 'TURN' | null>(null);
  const [connectionProgress, setConnectionProgress] = useState('CONNECTING...');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [networkStats, setNetworkStats] = useState({ bitrate: 0, fps: 0, packetLoss: 0, resolution: '' });
  const lastBytesReceived = useRef(0);
  const lastTimestamp = useRef(0);

  const [forceRelay, setForceRelay] = useState(false);

  const apiKey = import.meta.env.VITE_ANEDYA_API_KEY;
  const ANEDYA_API_BASE = 'https://api.anedya.io/v1';

  const getVsHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
  }, [apiKey]);

  const vsSet = async (key: string, value: string) => {
    if (!nodeId) return;
    const resp = await fetch(`${ANEDYA_API_BASE}/valuestore/setValue`, {
      method: 'POST',
      headers: getVsHeaders(),
      body: JSON.stringify({ namespace: { scope: 'node', id: nodeId }, key, value, type: 'string' }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`vsSet failed: ${resp.status} - ${text}`);
    }
  };

  const vsGet = async (key: string) => {
    if (!nodeId) return null;
    const resp = await fetch(`${ANEDYA_API_BASE}/valuestore/getValue`, {
      method: 'POST',
      headers: getVsHeaders(),
      body: JSON.stringify({ namespace: { scope: 'node', id: nodeId }, key }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    if (!json.value) return null;
    return json.value;
  };

  const fetchTurnCredentials = async () => {
    const resp = await fetch(`${ANEDYA_API_BASE}/relay/create`, {
      method: 'POST',
      headers: getVsHeaders(),
      body: JSON.stringify({ relayType: 'turn' }),
    });
    if (!resp.ok) throw new Error(`TURN fetch failed: ${resp.status}`);
    const json = await resp.json();
    if (!json.relayData) throw new Error(json.error || 'no relayData');
    return {
      ...json.relayData,
      password: json.relayData.credential,
      relayExpiry: json.relayExpiry,
    };
  };

  const stopStream = useCallback((e?: any) => {
    const isError = e === true;
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
    if (timelineTimerRef.current) { clearInterval(timelineTimerRef.current); timelineTimerRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    dcRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (!isError) {
      setStatus('ready');
    }
    setDuration(0);
    setPosition(0);
    setIsLive(false);
    setConnectionType(null);
    setShowStats(false);
    lastBytesReceived.current = 0;
    lastTimestamp.current = 0;
  }, []);

  const sendCmd = (cmd: any) => {
    if (dcRef.current && dcRef.current.readyState === 'open') {
      dcRef.current.send(JSON.stringify(cmd));
    }
  };

  const startStream = async () => {
    if (isEditMode || !nodeId || !apiKey) {
      setErrorMessage('Missing Node ID or API Key');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMessage('');
    setConnectionProgress('FETCHING RELAY CREDENTIALS...');

    try {
      const relayData = await fetchTurnCredentials();
      const turnPort = config?.config?.turnPort || 3478;

      const iceConfig = {
        iceTransportPolicy: forceRelay ? 'relay' : 'all' as RTCIceTransportPolicy,
        iceServers: [{
          urls: [
            `stun:${relayData.endpoint}:${turnPort}`,
            `turn:${relayData.endpoint}:${turnPort}`
          ],
          username: relayData.username,
          credential: relayData.password
        }],
      };

      const pc = new RTCPeerConnection(iceConfig);
      pcRef.current = pc;
      const dc = pc.createDataChannel('control', { ordered: true });
      dcRef.current = dc;

      dc.onopen = () => {
        sendCmd({ cmd: 'timeline' });
        timelineTimerRef.current = setInterval(() => sendCmd({ cmd: 'timeline' }), 2000);
      };

      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'timeline') {
            const newDuration = Number(msg.duration || 0);
            const newPosition = Number(msg.playback_offset ?? newDuration);
            setDuration(newDuration);
            if (!draggingSlider) {
              setPosition(Math.min(newPosition, newDuration));
            }
            setIsLive(msg.mode === 'live' || newDuration <= 0);
          } else if (msg.type === 'error') {
            console.error('Device Error:', msg.message);
          }
        } catch (err) {
          console.error('Failed to parse dc message', err);
        }
      };

      const videoTransceiver = pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      if (RTCRtpReceiver.getCapabilities) {
        const caps = RTCRtpReceiver.getCapabilities('video');
        if (caps) {
          const h264 = caps.codecs.filter(c => c.mimeType === 'video/H264');
          const rest = caps.codecs.filter(c => c.mimeType !== 'video/H264');
          if (h264.length) {
            try {
              videoTransceiver.setCodecPreferences([...h264, ...rest]);
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0] && videoRef.current) {
          videoRef.current.srcObject = e.streams[0];
          setStatus('streaming');
        }
      };

      pc.onconnectionstatechange = async () => {
        if (pc.connectionState === 'connected') {
          try {
            const stats = await pc.getStats();
            stats.forEach(report => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                const local = stats.get(report.localCandidateId);
                const remote = stats.get(report.remoteCandidateId);
                if (local?.candidateType === 'relay' || remote?.candidateType === 'relay') {
                  setConnectionType('TURN');
                } else {
                  setConnectionType('P2P');
                }
              }
            });
          } catch (err) {
            console.error('Failed to get WebRTC stats', err);
          }
        }
        if (pc.connectionState === 'failed') {
          setErrorMessage('WebRTC Connection failed');
          setStatus('error');
          stopStream(true);
        }
      };

      setConnectionProgress('GATHERING ICE CANDIDATES...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>(resolve => {
        if (pc.iceGatheringState === 'complete') { resolve(); return; }
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') resolve();
        };
      });

      if (pc.localDescription?.sdp && !pc.localDescription.sdp.includes('typ relay')) {
        setErrorMessage('Failed to create relay candidate. Please check your quota limits.');
        setStatus('error');
        stopStream(true);
        return;
      }

      const sessionId = Math.random().toString(36).slice(2, 10);
      const offerKey = `offer_${sessionId}`;
      const answerKey = `answer_${sessionId}`;

      const payload = JSON.stringify({
        offer: { sdp: pc.localDescription?.sdp, type: pc.localDescription?.type },
        turn: relayData
      });

      setConnectionProgress('SENDING OFFER TO DEVICE...');
      await vsSet(offerKey, payload);

      setConnectionProgress('WAITING FOR DEVICE ANSWER...');
      let attempts = 0;
      const MAX_ATTEMPTS = 30;
      pollTimerRef.current = setInterval(async () => {
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setErrorMessage('Device is not responding, kindly check your device.');
          setStatus('error');
          stopStream(true);
          return;
        }

        try {
          const value = await vsGet(answerKey);
          if (value) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            const answerSdp = JSON.parse(value);

            if (answerSdp.sdp && !answerSdp.sdp.includes('typ relay')) {
              setErrorMessage('Failed to create relay candidate. Please check your quota limits.');
              setStatus('error');
              stopStream(true);
              return;
            }

            setConnectionProgress('ESTABLISHING WEBRTC CONNECTION...');
            await pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
          }
        } catch (err) {
          // Keep polling
        }
      }, 2000);

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start stream');
      setStatus('error');
      stopStream(true);
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (showStats && status === 'streaming' && pcRef.current) {
      const interval = setInterval(async () => {
        try {
          const reports = await pcRef.current!.getStats();
          let newStats = { ...networkStats };
          reports.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              const bytes = report.bytesReceived;
              const timestamp = report.timestamp;
              if (lastTimestamp.current && lastBytesReceived.current) {
                const timeDiff = timestamp - lastTimestamp.current;
                const bytesDiff = bytes - lastBytesReceived.current;
                if (timeDiff > 0) {
                  const bitrate = (bytesDiff * 8) / timeDiff; // kbps
                  newStats.bitrate = Math.round(bitrate);
                }
              }
              lastBytesReceived.current = bytes;
              lastTimestamp.current = timestamp;

              newStats.fps = report.framesPerSecond || 0;
              const packetsLost = report.packetsLost || 0;
              const packetsReceived = report.packetsReceived || 0;
              const totalPackets = packetsLost + packetsReceived;
              newStats.packetLoss = totalPackets > 0 ? Number(((packetsLost / totalPackets) * 100).toFixed(2)) : 0;
            }
            if (report.type === 'track' && report.kind === 'video') {
              newStats.resolution = `${report.frameWidth || 0}x${report.frameHeight || 0}`;
            }
          });
          setNetworkStats(newStats);
        } catch (err) {
          console.error("Failed to fetch stats", err);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showStats, status, networkStats]);

  const takeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `snapshot-${new Date().toISOString().replace(/:/g, '-')}.jpg`;
        a.click();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };


  return (
    <Card ref={containerRef} className="w-full h-full flex flex-col bg-card overflow-hidden border shadow-sm hover:border-primary transition-colors cursor-default">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4 border-b flex-none z-10 relative bg-card">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground m-0">
          <Camera className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate" title={config.title}>{config.title || 'Camera View'}</span>
        </CardTitle>
        <div className="flex items-center gap-2 m-0">
          {status === 'streaming' && connectionType && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-sm
              ${connectionType === 'TURN' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' : 'bg-blue-500/20 text-blue-500 border-blue-500/30'}`}>
              {connectionType}
            </div>
          )}
          {status === 'streaming' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-[10px] font-medium border border-green-500/30 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[10px] font-medium border border-red-500/30 shadow-sm">
              <AlertCircle className="w-3 h-3" />
              ERROR
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col relative min-h-0 bg-black">
        {status === 'ready' && !isEditMode && (
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={() => setForceRelay(!forceRelay)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium tracking-wide transition-all duration-200 border shadow-sm backdrop-blur-md ${forceRelay
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/10'
                : 'bg-black/40 text-white/60 border-white/10 hover:bg-black/60 hover:text-white/80'
                }`}
            >
              <div className={`w-2 h-2 rounded-full transition-colors ${forceRelay ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-white/30'}`} />
              FORCE RELAY / TURN
            </button>
          </div>
        )}

        {/* Video Area */}
        <div className="flex-1 relative flex items-center justify-center min-h-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className={`w-full h-full object-contain ${status === 'streaming' ? 'opacity-100' : 'opacity-0'}`}
          />

          {status === 'streaming' && showStats && (
            <div className="absolute top-3 left-3 z-10 bg-black/60 p-3 rounded-lg backdrop-blur-sm border border-white/10 flex flex-col gap-1 text-[10px] text-white/90 font-mono shadow-lg">
              <div className="text-white/50 mb-1 font-sans text-[9px] uppercase tracking-wider">Network Stats</div>
              <div className="flex justify-between gap-4"><span>Bitrate:</span> <span>{networkStats.bitrate} kbps</span></div>
              <div className="flex justify-between gap-4"><span>Framerate:</span> <span>{networkStats.fps} fps</span></div>
              <div className="flex justify-between gap-4"><span>Packet Loss:</span> <span>{networkStats.packetLoss}%</span></div>
              {networkStats.resolution !== '0x0' && networkStats.resolution !== '' && (
                <div className="flex justify-between gap-4"><span>Resolution:</span> <span>{networkStats.resolution}</span></div>
              )}
            </div>
          )}

          {/* Status Overlays */}
          {status === 'ready' && !isEditMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-4">
              <Radio className="w-12 h-12 opacity-20" />
              <Button onClick={startStream} variant="secondary" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-0">
                <Play className="w-4 h-4 fill-current" />
                Start Stream
              </Button>
            </div>
          )}

          {status === 'connecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 gap-3">
              <Aperture className="w-8 h-8 animate-spin" />
              <span className="text-xs font-medium tracking-wide uppercase">{connectionProgress}</span>
              <div className="flex items-center gap-3 mt-2">
                <Button onClick={() => stopStream()} variant="outline" size="sm" className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white">
                  Cancel
                </Button>
                <Button onClick={() => { stopStream(); setTimeout(() => startStream(), 100); }} variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0">
                  Retry
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400/80 gap-3 px-6 text-center bg-red-950/20">
              <AlertCircle className="w-10 h-10 opacity-50" />
              <p className="text-sm">{errorMessage}</p>
              <Button onClick={startStream} variant="outline" size="sm" className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
                Retry Connection
              </Button>
            </div>
          )}

          {isEditMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-3 bg-white/5">
              <Radio className="w-10 h-10 opacity-30" />
              <span className="text-sm font-medium tracking-wide">CAMERA PREVIEW</span>
              <span className="text-xs opacity-70">Will connect in view mode</span>
            </div>
          )}
        </div>

        {/* DVR Controls */}
        {status === 'streaming' && (
          <div className="p-3 bg-black/80 border-t border-white/10 backdrop-blur-md">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] text-white/60 font-mono">
                <span>{formatTime(position)}</span>
                <span className="text-white/40">{duration > 0 ? formatTime(duration) : 'LIVE'}</span>
              </div>

              <div className="flex items-center gap-3">
                {config?.config?.showNetworkStatsBtn !== false && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 shrink-0 ${showStats ? 'text-blue-400 bg-blue-500/20 hover:bg-blue-500/30' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => setShowStats(!showStats)}
                    title="Network Stats"
                  >
                    <Info className="w-4 h-4 fill-current" />
                  </Button>
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 shrink-0"
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4 fill-current" />}
                </Button>

                {config?.config?.showSnapshotBtn !== false && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 shrink-0"
                    onClick={takeSnapshot}
                    title="Take Snapshot"
                  >
                    <Camera className="w-4 h-4 fill-current" />
                  </Button>
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 shrink-0"
                  onClick={stopStream}
                  title="Stop Stream"
                >
                  <Square className="w-4 h-4 fill-current" />
                </Button>

                <Slider
                  disabled={duration <= 0}
                  value={[draggingSlider ? position : Math.min(position, duration)]}
                  max={duration}
                  step={0.1}
                  className="flex-1"
                  onPointerDown={() => setDraggingSlider(true)}
                  onPointerUp={() => {
                    setDraggingSlider(false);
                    sendCmd({ cmd: 'seek', offset: position });
                  }}
                  onValueChange={(val) => setPosition(val[0])}
                />

                {duration > 0 && !isLive && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 shrink-0"
                    onClick={() => {
                      sendCmd({ cmd: 'live' });
                      setIsLive(true);
                    }}
                  >
                    GO LIVE
                  </Button>
                )}

                {config?.config?.showFullscreenBtn !== false && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 shrink-0"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4 fill-current" /> : <Maximize className="w-4 h-4 fill-current" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
