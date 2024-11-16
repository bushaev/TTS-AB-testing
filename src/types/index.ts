export interface AudioFile {
  name: string;
  path: string;
  sentence: string;
}

export interface Model {
  name: string;
  folderPath: string;
  files: AudioFile[];
}

export interface ModelStats {
  [modelName: string]: number;
} 