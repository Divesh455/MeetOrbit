
import asyncio
import inspect

from livekit import api


async def main():
    client = api.LiveKitAPI(
        url="https://example.livekit.cloud",
        api_key="inspection",
        api_secret="inspection",
    )

    try:
        print("\n=== EGRESS SERVICE METHODS ===")

        for name in dir(client.egress):
            if name.startswith("_"):
                continue

            method = getattr(client.egress, name)

            if callable(method):
                try:
                    print(name, inspect.signature(method))
                except (TypeError, ValueError):
                    print(name)

        print("\n=== PROTOBUF REQUEST FIELDS ===")

        for cls in (
            api.RoomCompositeEgressRequest,
            api.EncodedFileOutput,
            api.S3Upload,
        ):
            print(f"\n{cls.__name__}")

            for field in cls.DESCRIPTOR.fields:
                print(
                    f"  {field.name}: "
                    f"{field.message_type.full_name if field.message_type else field.type}"
                )

    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
