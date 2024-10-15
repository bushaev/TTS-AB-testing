declare module 'react-h5-audio-player' {
  import React from 'react';

  interface AudioPlayerProps {
    src: string;
    onError?: (e: Error) => void;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  const AudioPlayer: React.FC<AudioPlayerProps>;

  export default AudioPlayer;
}
