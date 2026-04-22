import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

const LOCAL_UPLOAD_DIR = '/tmp/uploads';

@Injectable()
export class FilesService {
  private s3: S3Client | null;
  private bucket: string;
  private useLocal: boolean;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID', '');
    const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY', '');
    this.useLocal = !accessKeyId || !secretAccessKey;

    if (!this.useLocal) {
      this.s3 = new S3Client({
        region: configService.get<string>('AWS_REGION', 'us-east-1'),
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.s3 = null;
      fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
      console.log('[files-service] No AWS credentials — using local disk storage');
    }

    this.bucket = configService.get<string>('AWS_S3_BUCKET', 'groupsapp-files');
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;

    if (this.useLocal) {
      const dest = path.join(LOCAL_UPLOAD_DIR, filename);
      fs.writeFileSync(dest, file.buffer);
      // Use gateway URL so the browser can fetch through the proxy
      const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3000';
      return `${gatewayUrl}/api/files/local/${filename}`;
    }

    const key = `uploads/${filename}`;
    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  serveLocal(filename: string): Buffer {
    const filePath = path.join(LOCAL_UPLOAD_DIR, path.basename(filename));
    if (!fs.existsSync(filePath)) throw new BadRequestException('File not found');
    return fs.readFileSync(filePath);
  }

  validateFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = /^(image\/|video\/|application\/pdf)/;
    if (file.size > maxSize) throw new BadRequestException('File size exceeds 10MB limit');
    if (!allowedTypes.test(file.mimetype)) throw new BadRequestException('File type not allowed');
  }
}
