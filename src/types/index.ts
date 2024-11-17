import { ChiSquareResult } from '../utils/statistics';

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

export interface StatisticalAnalysis {
    chiSquare: ChiSquareResult;
}

export interface ModelStats {
    total: number;
    byFile: Record<number, number>;
    statistics?: StatisticalAnalysis;
}

export interface ShuffleMapping {
    [displayIndex: number]: number;
}

export interface ShuffleMappings {
    [fileIndex: number]: ShuffleMapping;
}