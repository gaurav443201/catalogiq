import boto3
import os
from dotenv import load_dotenv

load_dotenv()

dynamodb = boto3.resource(
    "dynamodb",
    region_name=os.getenv("AWS_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

table = dynamodb.Table(os.getenv("DYNAMODB_TABLE", "catalogiq-products"))


def save_product(record: dict):
    """Save a product record to DynamoDB."""
    # DynamoDB requires Decimal for floats; confidence is int so we're fine
    table.put_item(Item=record)


def get_all_products():
    """Retrieve all product records, sorted newest first."""
    response = table.scan()
    items = response.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


def get_product_by_id(product_id: str):
    """Retrieve a single product by ID."""
    response = table.get_item(Key={"id": product_id})
    return response.get("Item")
