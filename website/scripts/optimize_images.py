import os
from PIL import Image

def convert_dir(path):
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(".png"):
                input_path = os.path.join(root, file)
                output_path = os.path.splitext(input_path)[0] + ".webp"
                if not os.path.exists(output_path):
                    print(f"Converting {input_path}...")
                    try:
                        img = Image.open(input_path)
                        img.save(output_path, "WEBP", quality=80)
                    except Exception as e:
                        print(f"Failed to convert {input_path}: {e}")

if __name__ == "__main__":
    convert_dir("public/cards")
    convert_dir("public/cards-portal")
    convert_dir("public/cosmic-selfie")
    # Single files
    for f in ["public/v4_fool.png", "public/nebula-bg.jpg"]:
        if os.path.exists(f):
            output = os.path.splitext(f)[0] + ".webp"
            print(f"Converting {f}...")
            try:
                img = Image.open(f)
                img.save(output, "WEBP", quality=80)
            except Exception as e:
                print(f"Failed to convert {f}: {e}")
