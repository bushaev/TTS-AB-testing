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
    [key: string]: {
        total: number;
        byFile: Record<number, number>;
    };
}

export interface ShuffleMapping {
    [displayIndex: number]: number;
}

export interface ShuffleMappings {
    [fileIndex: number]: ShuffleMapping;
}