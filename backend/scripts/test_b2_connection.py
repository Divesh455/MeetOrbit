
import uuid
from io import BytesIO

import boto3
from botocore.config import Config

from app.core.config import get_settings


def main():
    settings = get_settings()

    client = boto3.client(
        "s3",
        endpoint_url=settings.b2_endpoint,
        aws_access_key_id=settings.b2_key_id,
        aws_secret_access_key=settings.b2_application_key,
        region_name=settings.b2_region,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        ),
    )

    bucket = settings.b2_bucket_name
    test_key = f"meetorbit-tests/connection-{uuid.uuid4().hex}.txt"
    test_content = b"MeetOrbit Backblaze B2 connection test"

    try:
        # Verify bucket access
        client.head_bucket(Bucket=bucket)
        print("PASS: Bucket access verified")

        # Upload a small test object
        client.put_object(
            Bucket=bucket,
            Key=test_key,
            Body=BytesIO(test_content),
            ContentType="text/plain",
        )
        print("PASS: Test upload successful")

        # Download and verify
        response = client.get_object(Bucket=bucket, Key=test_key)
        downloaded = response["Body"].read()

        if downloaded != test_content:
            raise RuntimeError("Downloaded content does not match")

        print("PASS: Test download and content verification successful")

        # Clean up the test object
        client.delete_object(Bucket=bucket, Key=test_key)
        print("PASS: Test object deleted")

        print("\nB2 CONNECTION TEST: SUCCESS")

    except Exception as exc:
        print("\nB2 CONNECTION TEST: FAILED")
        print(f"Error type: {type(exc).__name__}")
        print(f"Error: {exc}")
        raise


if __name__ == "__main__":
    main()
