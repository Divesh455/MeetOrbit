
import { useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  useParticipants,
  useConnectionState,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import "@livekit/components-styles";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  Video,
  Users,
  Wifi,
  XCircle,
} from "lucide-react";
import {
  joinMeeting,
  type LiveKitJoinResponse,
} from "./lib/api";

type MeetingRoomProps = {
  workspaceId: string;
  meetingId: string;
  meetingTitle: string;
  onLeave: () => void;
};

function ConnectionBadge() {
  const connectionState = useConnectionState();

  const connected = connectionState === ConnectionState.Connected;
  const connecting =
    connectionState === ConnectionState.Connecting ||
    connectionState === ConnectionState.Reconnecting;

  return (
    <span
      className={`mo-connection-badge ${
        connected ? "is-connected" : connecting ? "is-connecting" : "is-disconnected"
      }`}
    >
      {connected ? (
        <CheckCircle2 size={14} />
      ) : connecting ? (
        <LoaderCircle className="mo-spinner" size={14} />
      ) : (
        <XCircle size={14} />
      )}
      {connected
        ? "Connected"
        : connecting
          ? "Connecting"
          : "Disconnected"}
    </span>
  );
}

function MeetingRoomContent({
  meetingTitle,
  onLeave,
}: {
  meetingTitle: string;
  onLeave: () => void;
}) {
  const participants = useParticipants();

  return (
    <main className="mo-room-page">
      <header className="mo-room-header">
        <div className="mo-room-brand">
          <div className="mo-brand-mark">
            <Video size={21} />
          </div>
          <div className="mo-room-heading">
            <strong>MeetOrbit</strong>
            <span>Meeting room</span>
          </div>
        </div>

        <div className="mo-room-title">
          <span className="mo-live-dot" />
          <span>{meetingTitle}</span>
        </div>

        <div className="mo-room-header-right">
          <ConnectionBadge />
          <span className="mo-participant-count">
            <Users size={16} />
            {participants.length}
          </span>
          <button
            className="mo-leave-button"
            onClick={onLeave}
            type="button"
          >
            Leave
          </button>
        </div>
      </header>

      <div className="mo-room-workspace">
        <div className="mo-livekit-container">
          <VideoConference />
        </div>
      </div>

      <footer className="mo-room-footer">
        <div>
          <ShieldCheck size={15} />
          <span>Your meeting connection is encrypted in transit.</span>
        </div>
        <div className="mo-footer-status">
          <Wifi size={15} />
          <span>Real-time meeting</span>
        </div>
      </footer>
    </main>
  );
}

export default function MeetingRoom({
  workspaceId,
  meetingId,
  meetingTitle,
  onLeave,
}: MeetingRoomProps) {
  const [credentials, setCredentials] =
    useState<LiveKitJoinResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function connectToMeeting() {
    setLoading(true);
    setError("");

    try {
      const result = await joinMeeting(workspaceId, meetingId);
      setCredentials(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to join this meeting.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!credentials) {
    return (
      <main className="mo-prejoin">
        <header className="mo-prejoin-header">
          <div className="mo-room-brand">
            <div className="mo-brand-mark">
              <Video size={21} />
            </div>
            <div className="mo-room-heading">
              <strong>MeetOrbit</strong>
              <span>Meeting intelligence</span>
            </div>
          </div>

          <button
            className="mo-back-button"
            onClick={onLeave}
            type="button"
          >
            <ArrowLeft size={17} />
            Back to meetings
          </button>
        </header>

        <section className="mo-prejoin-card">
          <div className="mo-prejoin-icon">
            <Video size={29} />
          </div>

          <span className="mo-eyebrow">READY WHEN YOU ARE</span>
          <h1>Join your meeting</h1>
          <p className="mo-prejoin-description">
            Check the meeting details, then enter your room.
            You can enable your camera and microphone inside.
          </p>

          <div className="mo-meeting-preview">
            <div className="mo-meeting-preview-icon">
              <Video size={20} />
            </div>
            <div>
              <strong>{meetingTitle}</strong>
              <span>Private meeting room</span>
            </div>
            <ShieldCheck size={19} />
          </div>

          <div className="mo-device-note">
            <div className="mo-device-note-icon">
              <Wifi size={18} />
            </div>
            <div>
              <strong>Audio and video controls</strong>
              <span>
                Your browser may ask for microphone or camera permission
                when you enable them.
              </span>
            </div>
          </div>

          {error && (
            <div className="mo-room-error" role="alert">
              <XCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="mo-join-button"
            onClick={connectToMeeting}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <>
                <LoaderCircle className="mo-spinner" size={18} />
                Preparing your room...
              </>
            ) : (
              <>
                <Video size={18} />
                Join meeting
              </>
            )}
          </button>

          <p className="mo-privacy-note">
            <ShieldCheck size={14} />
            Access is verified by MeetOrbit before joining.
          </p>
        </section>

        <footer className="mo-prejoin-footer">
          MeetOrbit · Meetings, made intelligent.
        </footer>
      </main>
    );
  }

  return (
    <LiveKitRoom
      key={credentials.room_name}
      serverUrl={credentials.server_url}
      token={credentials.token}
      connect={true}
      audio={false}
      video={false}
      onError={(err) => setError(err.message)}
      onMediaDeviceFailure={(_failure, kind) => {
        setError(
          `Unable to access your ${kind ?? "media"} device. Check browser permissions and device settings.`,
        );
      }}
      data-lk-theme="default"
      style={{ height: "100%" }}
    >
      {error && (
        <div className="mo-livekit-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <XCircle size={17} />
          </button>
        </div>
      )}

      <MeetingRoomContent
        meetingTitle={meetingTitle}
        onLeave={onLeave}
      />
    </LiveKitRoom>
  );
}
