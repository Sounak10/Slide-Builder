import { useCallback, type MouseEvent } from 'react';
import { Track } from 'livekit-client';
import {
  type TrackReference,
  useTrackToggle,
  usePersistentUserChoices,
  useLocalParticipantPermissions,
  useSessionContext,
} from '@livekit/components-react';
import { logger } from '@/lib/logger';

const trackSourceToProtocol = (source: Track.Source) => {
  // NOTE: this mapping avoids importing the protocol package as that leads to a significant bundle size increase
  switch (source) {
    case Track.Source.Camera:
      return 1;
    case Track.Source.Microphone:
      return 2;
    case Track.Source.ScreenShare:
      return 3;
    default:
      return 0;
  }
};

export interface PublishPermissions {
  camera: boolean;
  microphone: boolean;
  screenShare: boolean;
  data: boolean;
}

export function usePublishPermissions(): PublishPermissions {
  const localPermissions = useLocalParticipantPermissions();

  const canPublishSource = (source: Track.Source) => {
    return (
      !!localPermissions?.canPublish &&
      (localPermissions.canPublishSources.length === 0 ||
        localPermissions.canPublishSources.includes(trackSourceToProtocol(source)))
    );
  };

  return {
    camera: canPublishSource(Track.Source.Camera),
    microphone: canPublishSource(Track.Source.Microphone),
    screenShare: canPublishSource(Track.Source.ScreenShare),
    data: localPermissions?.canPublishData ?? false,
  };
}

export interface UseInputControlsProps {
  saveUserChoices?: boolean;
  onDisconnect?: () => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

export interface UseInputControlsReturn {
  microphoneTrack?: TrackReference;
  microphoneToggle: ReturnType<typeof useTrackToggle<Track.Source.Microphone>>;
  cameraToggle: ReturnType<typeof useTrackToggle<Track.Source.Camera>>;
  screenShareToggle: ReturnType<typeof useTrackToggle<Track.Source.ScreenShare>>;
  handleAudioDeviceChange: (deviceId: string) => void;
  handleVideoDeviceChange: (deviceId: string) => void;
  handleMicrophoneDeviceSelectError: (error: Error) => void;
  handleCameraDeviceSelectError: (error: Error) => void;
}

export function useInputControls({
  saveUserChoices = true,
  onDeviceError,
}: UseInputControlsProps = {}): UseInputControlsReturn {
  const {
    room,
    local: { microphoneTrack },
  } = useSessionContext();

  const microphoneToggle = useTrackToggle({
    source: Track.Source.Microphone,
    room,
    onDeviceError: (error) => onDeviceError?.({ source: Track.Source.Microphone, error }),
  });

  const cameraToggle = useTrackToggle({
    source: Track.Source.Camera,
    room,
    onDeviceError: (error) => onDeviceError?.({ source: Track.Source.Camera, error }),
  });

  const screenShareToggle = useTrackToggle({
    source: Track.Source.ScreenShare,
    room,
    onDeviceError: (error) => onDeviceError?.({ source: Track.Source.ScreenShare, error }),
  });

  const {
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({ preventSave: !saveUserChoices });

  const handleAudioDeviceChange = useCallback(
    (deviceId: string) => {
      logger.info('media', 'audio input device selected', { deviceId });
      saveAudioInputDeviceId(deviceId ?? 'default');
    },
    [saveAudioInputDeviceId],
  );

  const handleVideoDeviceChange = useCallback(
    (deviceId: string) => {
      logger.info('media', 'video input device selected', { deviceId });
      saveVideoInputDeviceId(deviceId ?? 'default');
    },
    [saveVideoInputDeviceId],
  );

  const handleToggleCamera = useCallback(
    async (enabled?: boolean) => {
      logger.info('media', 'camera toggle requested', {
        requestedEnabled: enabled,
        currentEnabled: cameraToggle.enabled,
        pending: cameraToggle.pending,
      });
      if (screenShareToggle.enabled) {
        screenShareToggle.toggle(false);
      }
      await cameraToggle.toggle(enabled);
      // persist video input enabled preference
      saveVideoInputEnabled(!cameraToggle.enabled);
      logger.info('media', 'camera toggle completed', {
        requestedEnabled: enabled,
        previousEnabled: cameraToggle.enabled,
      });
    },
    [cameraToggle, screenShareToggle, saveVideoInputEnabled],
  );

  const handleToggleMicrophone = useCallback(
    async (enabled?: boolean) => {
      logger.info('media', 'microphone toggle requested', {
        requestedEnabled: enabled,
        currentEnabled: microphoneToggle.enabled,
        pending: microphoneToggle.pending,
        hasTrack: !!microphoneTrack,
        roomName: room.name,
      });
      await microphoneToggle.toggle(enabled);
      // persist audio input enabled preference
      saveAudioInputEnabled(!microphoneToggle.enabled);
      logger.info('media', 'microphone toggle completed', {
        requestedEnabled: enabled,
        previousEnabled: microphoneToggle.enabled,
      });
    },
    [microphoneToggle, microphoneTrack, room, saveAudioInputEnabled],
  );

  const handleToggleScreenShare = useCallback(
    async (enabled?: boolean) => {
      logger.info('media', 'screen share toggle requested', {
        requestedEnabled: enabled,
        currentEnabled: screenShareToggle.enabled,
        pending: screenShareToggle.pending,
      });
      if (cameraToggle.enabled) {
        cameraToggle.toggle(false);
      }
      await screenShareToggle.toggle(enabled);
      logger.info('media', 'screen share toggle completed', {
        requestedEnabled: enabled,
        previousEnabled: screenShareToggle.enabled,
      });
    },
    [cameraToggle, screenShareToggle],
  );
  const handleMicrophoneDeviceSelectError = useCallback(
    (error: Error) => {
      logger.error('media', 'microphone device error', error);
      onDeviceError?.({ source: Track.Source.Microphone, error });
    },
    [onDeviceError],
  );

  const handleCameraDeviceSelectError = useCallback(
    (error: Error) => {
      logger.error('media', 'camera device error', error);
      onDeviceError?.({ source: Track.Source.Camera, error });
    },
    [onDeviceError],
  );

  const microphoneButtonProps = {
    ...microphoneToggle.buttonProps,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      logger.info('media', 'microphone button clicked', {
        currentEnabled: microphoneToggle.enabled,
        requestedEnabled: !microphoneToggle.enabled,
        pending: microphoneToggle.pending,
        hasTrack: !!microphoneTrack,
      });
      microphoneToggle.buttonProps.onClick?.(event);
    },
  };

  const cameraButtonProps = {
    ...cameraToggle.buttonProps,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      logger.info('media', 'camera button clicked', {
        currentEnabled: cameraToggle.enabled,
        requestedEnabled: !cameraToggle.enabled,
        pending: cameraToggle.pending,
      });
      cameraToggle.buttonProps.onClick?.(event);
    },
  };

  return {
    microphoneTrack,
    cameraToggle: {
      ...cameraToggle,
      toggle: handleToggleCamera,
      buttonProps: cameraButtonProps,
    },
    microphoneToggle: {
      ...microphoneToggle,
      toggle: handleToggleMicrophone,
      buttonProps: microphoneButtonProps,
    },
    screenShareToggle: {
      ...screenShareToggle,
      toggle: handleToggleScreenShare,
    },
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleMicrophoneDeviceSelectError,
    handleCameraDeviceSelectError,
  };
}
