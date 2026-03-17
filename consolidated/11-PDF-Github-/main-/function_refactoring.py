import json

def refactored_code():
    result = {
        "type": "object"
    }
    return json.dumps(result)

if __name__ == "__main__":
    print(refactored_code())