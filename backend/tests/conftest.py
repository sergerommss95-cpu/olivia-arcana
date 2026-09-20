import os
import sys

# Make the backend root importable regardless of pytest invocation cwd.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
