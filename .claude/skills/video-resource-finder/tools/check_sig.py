from ddgs import DDGS
import inspect

with DDGS() as ddgs:
    sig = inspect.signature(ddgs.images)
    print(f"Signature: {sig}")
