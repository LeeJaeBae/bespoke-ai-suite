import mongoose, { Schema, Document } from 'mongoose';
import { ContentType, ContentStatus } from '@domain/value-objects/ContentType.js';

export interface ContentDocument extends Document {
  _id: string;
  type: ContentType;
  title: string;
  body: string;
  userId: string;
  prompt?: string;
  status: ContentStatus;
  qualityScore?: number;
  metadata: {
    keywords: string[];
    tags: string[];
    targetAudience: string;
    tone: string;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<ContentDocument>({
  _id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(ContentType),
    required: true
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  body: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  prompt: {
    type: String
  },
  status: {
    type: String,
    enum: Object.values(ContentStatus),
    required: true,
    default: ContentStatus.DRAFT,
    index: true
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  metadata: {
    keywords: [{
      type: String
    }],
    tags: [{
      type: String,
      index: true
    }],
    targetAudience: {
      type: String,
      default: 'general'
    },
    tone: {
      type: String,
      default: 'professional'
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true,
  _id: false // We're providing our own _id
});

// Compound indexes for common queries
ContentSchema.index({ userId: 1, status: 1, createdAt: -1 });
ContentSchema.index({ tags: 1, status: 1 });
ContentSchema.index({ 'metadata.keywords': 1 });

export const ContentModel = mongoose.model<ContentDocument>('Content', ContentSchema);