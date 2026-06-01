import { getGuidancePackage } from './config/config-loader.js';

const guidancePackage = getGuidancePackage();

export const GUIDANCE_TASK = guidancePackage.constants.guidanceTask;
export const READING_LEVEL = guidancePackage.constants.readingLevel;
export const WRITE_LENGTH = guidancePackage.constants.writeLength;
export const REWRITE_LENGTH = guidancePackage.constants.rewriteLength;
export const CRITIQUE_DEPTH = guidancePackage.constants.critiqueDepth;

export const OUTPUT_TEMPLATES = guidancePackage.outputTemplates;
export const READING_LEVEL_BLOCKS = guidancePackage.readingLevelBlocks;
export const TASK_LENGTH_BLOCKS = guidancePackage.taskLengthBlocks;
export const GENERIC_BLOCKS = guidancePackage.genericBlocks;
