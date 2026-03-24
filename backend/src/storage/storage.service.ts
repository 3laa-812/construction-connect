import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export type StorageFolder =
  | 'kyb-docs'
  | 'rfq-attachments'
  | 'site-photos'
  | 'delivery-notes'
  | 'invoices';

/**
 * S3 uploads with SSE-S3 (AES256). Credentials: default AWS provider chain
 * (e.g. AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY or instance role).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;

  private getS3(): S3Client {
    if (!this.client) {
      const region = process.env.AWS_REGION || 'us-east-1';
      this.client = new S3Client({ region });
    }
    return this.client;
  }

  private requireBucketConfig(): { bucket: string; region: string } {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION || 'us-east-1';
    if (!bucket) {
      this.logger.error('AWS_S3_BUCKET is not set');
      throw new InternalServerErrorException('Object storage is not configured');
    }
    return { bucket, region };
  }

  async uploadFile(
    buffer: Buffer,
    mimeType: string,
    folder: StorageFolder,
  ): Promise<string> {
    const { bucket, region } = this.requireBucketConfig();
    const key = `${folder}/${randomUUID()}-${Date.now()}`;
    try {
      await this.getS3().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ServerSideEncryption: 'AES256',
        }),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'S3 upload failed';
      this.logger.error(msg);
      throw new InternalServerErrorException('File upload failed');
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  /**
   * Upload and return the S3 object key only (for later presigned GETs).
   */
  async uploadBufferAndReturnKey(
    buffer: Buffer,
    mimeType: string,
    folder: StorageFolder,
  ): Promise<string> {
    const { bucket } = this.requireBucketConfig();
    const key = `${folder}/${randomUUID()}-${Date.now()}`;
    try {
      await this.getS3().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ServerSideEncryption: 'AES256',
        }),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'S3 upload failed';
      this.logger.error(msg);
      throw new InternalServerErrorException('File upload failed');
    }
    return key;
  }

  getPublicObjectUrl(key: string): string {
    const { bucket, region } = this.requireBucketConfig();
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  async getSignedUrl(key: string): Promise<string> {
    const { bucket } = this.requireBucketConfig();
    return getSignedUrl(
      this.getS3(),
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 3600 },
    );
  }
}
