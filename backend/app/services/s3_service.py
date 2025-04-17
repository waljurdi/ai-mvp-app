import boto3
import io
from botocore.exceptions import BotoCoreError, ClientError
from app.config import settings
from app.logger import logger
from fastapi import HTTPException

s3_client = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)


def generate_presigned_url(key: str) -> str:
    return s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={'Bucket': settings.S3_BUCKET, 'Key': key},
        ExpiresIn=3600
    )


async def upload_file(barcode: str, filename: str, content: bytes, content_type: str) -> str:
    from uuid import uuid4
    import os
    extension = os.path.splitext(filename)[1] or ".jpg"
    s3_key = f"products/{barcode}/{uuid4()}{extension}"

    try:
        s3_client.upload_fileobj(
            Fileobj=io.BytesIO(content),
            Bucket=settings.S3_BUCKET,
            Key=s3_key,
            ExtraArgs={"ContentType": content_type},
        )
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")

    logger.info(f"Uploaded file to S3: {s3_key}")
    return s3_key
