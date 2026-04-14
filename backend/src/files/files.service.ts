import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class FilesService {
  private s3: S3Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
    this.bucket = configService.get<string>('AWS_S3_BUCKET', 'groupsapp-files');
  }

  async uploadToS3(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname);
    const key = `uploads/${randomUUID()}${ext}`;

    await this.s3.send(
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

  validateFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10 MB
    const allowedTypes = /^(image\/|video\/|application\/pdf)/;

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }
    if (!allowedTypes.test(file.mimetype)) {
      throw new BadRequestException('File type not allowed. Use image, video, or PDF');
    }
  }
}
